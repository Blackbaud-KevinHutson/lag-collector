const log = require('./logger');
const transform = require('./transform_to_chart');
let fs = require('fs');
let _ = require('lodash');
const dateUtils = require('./date_utils');
const consumerList = require('./consumers');

const HTML_TITLE = 'Kafka lag-collector';

function generatePage (app, parentDirectory, content) {
  if (!fs.existsSync(parentDirectory)) {
    fs.mkdirSync(parentDirectory);
  }
  fs.writeFile(`${parentDirectory}/${app}.htm`, content, (err) => {
    if (err) {
      throw err;
    }
  });
}

function baseJSDeclarations () {
  return `
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
  <script src="/js/js.cookie.js"></script>
  `;
}

function navBarTemplate (app) {
  let now = dateUtils.formattedTime();
  let appCrumb = app ? `<li class="breadcrumb-item active" aria-current="page">${app}</li>` : '';
  return `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="/index.htm">Kafka Lag Collector</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarText">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item active">
        ${appCrumb}
        </li>
      </ul>
      <span class="navbar-text">
        <a href="/settings.htm">Settings</a>
      </span>
    </div>
    </nav>
    <div class="alert alert-info" role="alert">Content was generated at ${now}</div>
  `;
}

function appPageDivTemplate (app, topics) {
  let uniqueTopics = _.uniq(topics);
  let topicDivs = '';
  _.each(uniqueTopics, (topic) => {
    topicDivs = topicDivs + `<a name="chart-${app}-${topic}"></a></a><div id="ch-${app}-${topic}" style="width:100%; height:400px;"></div>`;
  });
  return `<div id="${app}" class="tabcontent">${topicDivs}</div>`;
}

function appPageTemplate (app, topics, appChartData) {
  let divs = appPageDivTemplate(app, topics);
  return `
  <!doctype html>
  <html lang="en">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>${HTML_TITLE}-${app}</title>
  ${baseJSDeclarations()}
  <script src="https://code.highcharts.com/highcharts.js"></script>
  <script src="https://code.highcharts.com/modules/series-label.js"></script>
  <script src="https://code.highcharts.com/modules/exporting.js"></script>
  <script src="https://code.highcharts.com/modules/export-data.js"></script>
  <script src="/js/highchart-custom-themes.js"></script>
  <script type="text/javascript">
        var thisTheme = Cookies.get('themeName');
        // If we have a theme, use it
        if(thisTheme && thisTheme != 'default') {
          // hack get the name of this variable in this scope
          Highcharts.setOptions(this[thisTheme]);
        }
  </script>
  <script type="text/javascript">
  $(function () { 

    ${appChartData}
   });
</script>
</head>
 <body>
   <div class="container">
   ${navBarTemplate(app)}
   <div class="row">
       <div class="col">
        ${divs}
       </div>
     </div>
   </div>
   </body>
</html>  
  `;
}

function indexPageTemplate (apps) {
  return `
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>${HTML_TITLE}</title>
    ${baseJSDeclarations()}
    <link rel="stylesheet" type="text/css" href="/main.css">
    <script type="text/javascript">
    $(function () { 
  
     });
  </script>
  </head>
  <body>
    <div class="container">
    ${navBarTemplate()}
    ${apps}
    </div>
  </body>
  </html>  
    `;
}

function cardTitleTemplate (app) {
  return `<h4 class="card-title"><a href="charts/${app}.htm">${app}</a></h4>\n`;
}

function cardSubTitleTemplate (subtitle) {
  return `<h6 class="card-subtitle mb-2 text-muted">${subtitle}</h6>\n`;
}

function rowTemplate (content) {
  return `<div class="row">${content}</div>`;
}

function columnTemplate (content, width) {
  if (!width) {
    width = 6;
  }
  return `<div class="span${width} ml-2 mr-2">${content}</div>`;
}

function warningIndicatorColorClass (lagNumber) {
  if (lagNumber === 0 || !lagNumber) {
    return 'success';
  } else if (lagNumber < 10000) {
    return 'info';
  } else if (lagNumber > 10000) {
    return 'warning';
  } else if (lagNumber > 100000) {
    return 'danger';
  }
}

function formatLag (lag) {
  return lag ? lag.toLocaleString() : 0;
}

function legendGroupItem (item, itemType) {
  return `<li class="list-group-item list-group-item-${itemType}"><small>${item}</small></li>`;
}

function listGroupItem (app, topic, lag) {
  let nameTag = `chart-${app}-${topic}`;
  const colorClass = warningIndicatorColorClass(lag);
  return `<li class="list-group-item">
    <button type="button" class="btn btn-${colorClass}" onclick="location.href='charts/${app}.htm#${nameTag}'">
      ${topic} <span class="badge badge-light">${formatLag(lag)}</span>
    </button>
    </li>
  `;
}

function listGroup (items) {
  return `<p class="card-text"><ul class="list-group">${items}</ul></p>`;
}

function cardTemplate (cardTitle, cardText, cardSubtitle) {
  if (!cardSubtitle) {
    cardSubtitle = '';
  }
  return `<div class="card mt-2 mb-2"><div class="card-body">${cardTitle}${cardSubtitle}${cardText}</div></div>`;
}

function buildCardForConsumer (consumerName, consumerLag) {
  let cardTitle = cardTitleTemplate(consumerName);
  let items = consumerLag.map(lag => listGroupItem(consumerName, lag.TOPIC, lag.TOTAL_TOPIC_LAG)).join('');
  const listGroupItems = listGroup(items);
  return cardTemplate(cardTitle, listGroupItems);
}

function generateLegend () {
  const cardTitle = '<h4 class="card-title">Legend</h4>';
  let items = '';
  items += legendGroupItem('0', 'success');
  items += legendGroupItem('< 10k', 'info');
  items += legendGroupItem('> 10k < 100k', 'warning');
  items += legendGroupItem('> 100k', 'danger');
  return cardTemplate(cardTitle, items, cardSubTitleTemplate('Lag colors at each range'));
}

function generateMainMenu (currentSummarizedLagItems) {
  let lagByConsumer = _.groupBy(currentSummarizedLagItems, 'consumerName');
  // FIXME another undefined issue. fix it by hack for now
  delete lagByConsumer.undefined;
  const consumerNames = Object.keys(lagByConsumer);
  let leftContent = generateLegend();
  let rightContent = '';
  let i = 1;
  consumerNames.forEach(consumerName => {
    let consumerLag = lagByConsumer[consumerName];
    if (i % 2 === 0) {
      leftContent += buildCardForConsumer(consumerName, consumerLag);
    } else {
      rightContent += buildCardForConsumer(consumerName, consumerLag);
    }
    i++;
  });
  return rowTemplate(`${columnTemplate(leftContent, 6)}${columnTemplate(rightContent, 6)}`);
}

function topicsForApp (lagForApp) {
  let topics = new Set();
  _.each(lagForApp, (lagItem) => {
    return topics.add(lagItem.TOPIC);
  });
  return Array.from(topics);
}

function generatePages (currentSummarizedLagItems, lagRows) {
  let htmlItems = generateMainMenu(currentSummarizedLagItems);
  let indexPageContent = indexPageTemplate(htmlItems);
  generatePage('index', 'public', indexPageContent);

  let lagByApplication = transform.groupDataByApplication(lagRows);
  let consumerGroups = consumerList.map(consumer => consumer.groupName);
  _.each(consumerGroups, (app) => {
    log.info(`generatePages app=${app}`);
    let appChartData = transform.buildChartForApp(app, lagByApplication);

    let lagForApp = lagByApplication[app];
    let topics = topicsForApp(lagForApp);
    log.info(`generatePages app=${app} topics=${topics}`);
    let appPageContent = appPageTemplate(app, topics, appChartData);
    generatePage(app, 'public/charts', appPageContent);
  });
}

module.exports = { generatePages };

const log = require('./logger');
const transform = require('./transform_to_chart');
let fs = require('fs');
let _ = require('lodash');
let moment = require('moment');
const PropertiesReader = require('properties-reader');
let properties = PropertiesReader('settings.properties');
let utcOffset = properties.get('main.pages.time.utcoffset');
const consumerList = require('./consumers');

const HTML_TITLE = 'Kafka lag-collector';

function generatePage(app, parentDirectory, content) {
  if (!fs.existsSync(parentDirectory)){
    fs.mkdirSync(parentDirectory);
}
  fs.writeFile(`${parentDirectory}/${app}.htm`, content, (err) => {
    if (err) throw err;
  });
}

function baseJSDeclarations() {
  return `
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
  <script src="/js/js.cookie.js"></script>
  `;
}

function navBarTemplate(app) {
  let now = moment().utcOffset(utcOffset || '-05:00');
  let app_crumb = app ? `<li class="breadcrumb-item active" aria-current="page">${app}</li>` : '';
  return `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="/index.htm">Kafka Lag Collector</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarText">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item active">
        ${app_crumb}
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

function appPageDivTemplate(app, topics)  {
  let unique_topics = _.uniq(topics);
  let topicDivs = ``;
  _.each(unique_topics, (topic) => {
    topicDivs += `<div id="ch-${app}-${topic}" style="width:100%; height:400px;"></div>`;
  });
  return `<div id="${app}" class="tabcontent">${topicDivs}</div>`;
}

function appPageTemplate(app, topics, appChartData) {
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

function indexPageTemplate(apps) {
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
    <div class="row">
        <div class="col">
          ${apps}
        </div>
      </div>
    </div>
  </body>
  </html>  
    `;
  }
  
function generateMainMenu() {
  let consumerGroups = consumerList.map(consumer => consumer.group_name)
  let app_rows = _.chunk(consumerGroups, 4);
  return _.map(app_rows, (apps) => {
    return '<div class="row menuRow"><div class="col">' +
    generateListItems(apps) 
    + '</div></div>';
  }).join('');
}

function generateListItems(apps) {
  return _.map(apps, (app) => {
  return `
    <button type="button" class="btn btn-primary btn-lg" 
      onclick="location.href='charts/${app}.htm'">${app}</button>\n`;
  }).join('');
}

function topicsForApp(lagForApp) {
  let topics = new Set();
  _.each(lagForApp, (lagItem) => {
    return topics.add(lagItem["TOPIC"]);
  })  
  return Array.from(topics);
}

function generatePages(lagRows) {
  let htmlItems = generateMainMenu();
  let indexPageContent = indexPageTemplate(htmlItems);
  generatePage('index', 'public', indexPageContent);

  let lag_by_application = transform.groupDataByApplication(lagRows);    
  let consumerGroups = consumerList.map(consumer => consumer.group_name)
  _.each(consumerGroups, (app) => {
    log.log('INFO', `generatePages app=${app}`);
    let appChartData = transform.buildChartForApp(app, lag_by_application);

    let lagForApp = lag_by_application[app];
    let topics = topicsForApp(lagForApp);
    log.log('INFO',`generatePages app=${app} topics=${topics}`);
    let appPageContent = appPageTemplate(app, topics, appChartData);
    generatePage(app, 'public/charts', appPageContent);
  });
}

module.exports = { generatePages };  

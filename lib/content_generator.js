const transform = require('./transform_to_chart');
let fs = require('fs');
let _ = require('lodash');
let moment = require('moment');

const HTML_TITLE = 'Kafka lag-collector';

function generatePage(app, parentDirectory, content) {
  if (!fs.existsSync(parentDirectory)){
    fs.mkdirSync(parentDirectory);
}
  fs.writeFile(`${parentDirectory}/${app}.htm`, content, (err) => {
    if (err) {
      return console.log(err);
    }
  });
}

function bootStrap() {
  return `
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
`;
}

function navBarTemplate(app) {
  let now = moment().format('MMMM Do YYYY, h:mm:ss a');
  let app_crumb = app ? `<li class="breadcrumb-item active" aria-current="page">${app}</li>` : '';
  return `
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/index.htm">Kafka Lag Collector</a></li>
      ${app_crumb}
    </ol>
  </nav>
  <div class="alert alert-info" role="alert">Content was generated at ${now}</div>
  `;
}

function appPageDivTemplate(app, topics)  {
  let topicDivs = ``;
  _.each(topics, (topic) => {
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
  ${bootStrap()}
  <script src="https://code.highcharts.com/highcharts.js"></script>
  <script src="https://code.highcharts.com/modules/series-label.js"></script>
  <script src="https://code.highcharts.com/modules/exporting.js"></script>
  <script src="https://code.highcharts.com/modules/export-data.js"></script>
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
    ${bootStrap()}
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
  
function generateMainMenu(appsAndTopics) {
  let all_apps = Object.keys(appsAndTopics);
  let app_rows = _.chunk(all_apps, 4);
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

function getAppsAndTopics(all_rows, callback) {
    let appsAndTopics = {};
    _.each(all_rows, (row) => {
      let consumerName = row['consumer_name'];
      let topic = row['topic'];
      if(!appsAndTopics[consumerName]) {
        appsAndTopics[consumerName] = [];
      }
      appsAndTopics[consumerName].push(topic);
    });
    callback(appsAndTopics);  
  }

  function generatePages(appAndTopicRows, lagRows) {
    getAppsAndTopics(appAndTopicRows, (appsAndTopics) => {
      let htmlItems = generateMainMenu(appsAndTopics);
      let indexPageContent = indexPageTemplate(htmlItems);
      generatePage('index', 'public', indexPageContent);
      let lag_by_application = transform.groupDataByApplication(lagRows);    
      _.each(Object.keys(appsAndTopics), (app) => {
        let appChartData = transform.buildChartForApp(app, lag_by_application);
        let appPageContent = appPageTemplate(app, appsAndTopics[app], appChartData);
        generatePage(app, 'public/charts', appPageContent);
      });
    });
  }
  
module.exports = { generatePages };  


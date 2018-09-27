var express = require('express');
const transform = require('./transform_to_chart');

function start(lag_data) {
    let lag_by_application = transform.groupDataByApplication(lag_data);
    
    // Tranform our data into a series of HighCharts
    let charts = transform.buildChartsAsJavaScript(lag_by_application);

    let apps = Object.keys(lag_by_application);
    let app_tab_buttons = transform.tabButtonsTemplate(apps);
    let app_tabs = transform.tabsContentTemplate(lag_by_application);

    var app = express();
    app.use(express.static('public'));
    app.get('/', function (req, res) {
      let html = `
      <html>
      <head>
      <link rel="stylesheet" type="text/css" href="main.css">
      <script src="main.js"></script>
      <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
      <script src="https://code.highcharts.com/highcharts.js"></script>
      <script src="https://code.highcharts.com/modules/series-label.js"></script>
      <script src="https://code.highcharts.com/modules/exporting.js"></script>
      <script src="https://code.highcharts.com/modules/export-data.js"></script>
      <script type="text/javascript">
      $(function () { 
          ${charts}
    });
    </script>
    </head>
    <body>
    <div class="logo">Kafka Lag Collector</div>

    <div class="tab">
        ${app_tab_buttons}
    </div>
    
    <!-- Tab content -->
    ${app_tabs}

    </body>
    </html>
    `;
      res.send(html);
    })
    app.listen(3000);
}

module.exports = { start };
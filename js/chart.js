//'use strict';

//const d3Selection = require('d3-selection');
//const donut = require('./../../src/charts/donut');
//const legend = require('./../../src/charts/legend');

let donutData1 = {
  data:[
    {name: "Shiny", id: 1, quantity: 86},
    {name: "Blazing", id: 2, quantity: 300},
    {name: "Dazzling", id: 3, quantity: 276},
    {name: "Radiant", id: 4, quantity: 195},
    {name: "Sparkling", id: 5, quantity: 36},
    {name: "Other", id: 0, quantity: 814}
  ]
};

function createDonutChart() {
  let donutChart = britecharts.donut(),
  legendChart = britecharts.legend(),
  legendContainer;

  donutChart
    .width(400)
    .height(300);
  
  legendChart
    .width(300)
    .height(200)
    .numberFormat('s');
  
  d3.select('.js-donut-chart-container').datum(donutData1.data).call(donutChart);
  legendContainer = d3.select('.js-legend-chart-container');
  legendContainer.datum(donutData1.data).call(legendChart);

}


//createDonutChart();

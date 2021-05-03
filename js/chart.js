/*
const emotions = [
    'Calm', 'Chill', 'Energetic', 'Powerful', 'Sentimental',
    'Soothing', 'Upbeat', 'Vulnerable', 'Wistful'
]

const colors = [
    '#78d6c2', '#7ee171', '#ff920c', '#ff4500', '#3262bc',
    '#0b6623', '#fff675', '#f2a0b9', '#908cbd'
]
*/

// Instantiate Bar Chart
const barChart = britecharts.bar();
const container = d3.select('.bar-container');
const colors = ['#ff920c', '#ff4500', '#0b6623',
     '#fff675', '#908cbd']

// Create Dataset with proper shape
const barData = [
    { name: 'Energetic', value: 5 },
    { name: 'Powerful', value: 4 },
    { name: 'Soothing', value: 7},
    { name: 'Upbeat', value: 3 },
    { name: 'Wistful', value: 2 }
];

// Configure chart
barChart
    .isAnimated(true)
    .colorSchema(colors)
    .enableLabels(true)
    .labelsNumberFormat('.0')
    .margin({ left: 100 })
    .isHorizontal(true)
    .height(200)
    .width(300);

container.datum(barData).call(barChart);
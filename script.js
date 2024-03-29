$(document).ready(function () {
  drawChart("#chartSVG");

  drawNav("vxTabs");
  drawNav("dxTabs");
  drawNav("txTabs");

});

function drawNav(tab) {
  var elm = "#" + tab;
  var data = [];
  $(metadata).each(function () {
    if(this.tab == tab) {
      data.push(this);
    }
  });
  var tabHeader = `
    <ul class="nav nav-pills nav-tabs" role="tablist">
    ${ data.map((item, i) => `
      <li class="nav-item" role="presentation">
        <a class="nav-link nav-metric ${ i == 0 ? 'active' : ''}" id="${ item.id }_Link" data-bs-toggle="pill" data-bs-target="#${ item.id }" type="button" role="tab" aria-controls="${ item.id }" aria-selected="true">
          <div class="metric-name">${ item.name }</div>
          <div>
            <span class="material-icons risk-${ item.level_value }">fiber_manual_record</span>
            <span class="metric-value">${ parseInt(item.value) }</span>
            <span class="metric-unit">${ item.unit }</span>
          </div>
        </a>
      </li>
    `.trim()).join("") }
    </ul>
  `
  $(elm).html(tabHeader.trim());

  var tabContent = `
    <div id="tab-content" class="tab-content">
    ${ data.map((item, i) => `
      <div class="tab-pane fade show ${ i == 0 ? 'active' : ''}" id="${ item.id }" role="tabpanel">
        <div>[${ item.id } TBC]</div>
        <div id="svg-wrapper-container" class="svg-container">
        <svg id="${ item.id }_SVG" class="map"></svg>
        </div>
        <div>
          <img class="chart-legend" src="images/scale.png" height="30" />
          <div class="chart-source">This data is sourced from ${ item.source }</div>
        </div>
      </div>
  `.trim()).join("") }
    </div>
  `
  $(elm).after($(tabContent.trim()));
  $(data).each(function () {
    drawMap("#" + this.id + "_SVG", this);
  });
}

function drawMap(elm, metric) {
  var svg = d3.select(elm),
  width = document.getElementById('svg-wrapper-container').clientWidth;
  height = document.getElementById('svg-wrapper-container').clientWidth / 1.5;
  // Map and projection
  var projection = d3.geoMercator()
    .scale(width/640 * 100)
    .center([0, 30])
    .translate([width / 2, height / 2]);
  let data = new Map(); // Defines Data variable  
  // Load external data and boot
  Promise.all([
      d3.json("data/world.geojson"),
      d3.csv("data/metrics_final.csv")
    ])
    .then(function ([world, metricData]) {
    
    // Defining color range
    /*
    let colorScale = d3.scaleOrdinal();
    let colorRange;
    if (metric.level_dir === "asc") {
        colorRange = [
          `rgb(0, 212, 116)`,
          `rgb(255, 201, 0)`,
          `rgb(217, 0, 44)`, 
          `rgb(121, 0, 25)`
        ]
    } else {
      colorRange = [
          `rgb(121, 0, 25)`,
          `rgb(217, 0, 44)`,
          `rgb(255, 201, 0)`,
          `rgb(0, 212, 116)`
        ]
    }
      switch (metric.tab){
        case "vxTabs":
          colorScale
            .domain([metric.level_1, metric.level_2, metric.level_3, metric.level_4])
            .range(colorRange)
          break;
        case "dxTabs":
          colorScale
            .domain([metric.level_1, metric.level_2, metric.level_3])
            .range(colorRange)
          break;
        case "txTabs":
          colorScale
            .domain([metric.level_1, metric.level_2, metric.level_3])
            .range(colorRange)
          break;
      }
      */
      let mouseOver = function (d) {
        d3.selectAll(".Country")
          .transition()
          .duration(200)
          .style("opacity", .5)

        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", .8)
          .style("stroke", "#666");
      }
      let mouseLeave = function (d) {
        d3.selectAll(".Country")
          .transition()
          .duration(200)
          .style("opacity", .8)
          .style("stroke", "transparent");
        d3.select(this)
          .transition()
          .duration(0)
          .style("stroke", "transparent");
      }



      // Combine geoJson and CSV file matrics
      const parts = world.features
      parts.forEach(geoJsonObject => {

        const linkedData = metricData.find(d => d.iso_code === geoJsonObject.id)
        geoJsonObject.data = linkedData
        data.set(linkedData);
      })
      


      // Draw the map
      svg
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRatio", "xMinYMin meet")
      svg.append("g")
        .selectAll("path")
        .data(world.features)
        .enter()
        .append("path")
        // .attr("d", path)
        // .join("path")
        // draw each country
        .attr("class", function (d) {
          return "Country"
        })
        .attr("d", d3.geoPath()
          .projection(projection)
        )
        .style("stroke", "transparent")
        // set the color of each country
        .style("opacity", .8)
        .attr("fill", function (d) {
          let color = "#eee";
          let color_1 = "rgb(242, 223, 145)";
          let color_2 = "rgb(255, 201, 0)";
          let color_3 = "rgb(255, 150, 0)";
          let color_4 = "rgb(217, 0, 44)";
          let color_5 = "rgb(121, 0, 25)";

          if (d.data) {
            if (d.data[metric.metric]) {
              let value = d.data[metric.metric];
              if (value.length > 0) {
                if (metric.risk_dir == "asc") {
                  if (! $.isNumeric(value)) {
                    color = "#eee";
                  } else if (value < metric.risk_1) {
                    color = color_1;
                  } else if (value < metric.risk_2) {
                    color = color_2;
                  } else if (value < metric.risk_3) {
                    color = color_3;
                  } else if (value < metric.risk_4) {
                    color = color_4;
                  } else  {
                    color = color_5;
                  }
                } else {
                  if (! $.isNumeric(value)) {
                    color = "#eee";
                  } else if (value < metric.risk_5) {
                    color = color_5;
                  } else if (value < metric.risk_4) {
                    color = color_4;
                  } else if (value < metric.risk_3) {
                    color = color_3;
                  } else if (value < metric.risk_2) {
                    color = color_2;
                  } else  {
                    color = color_1;
                  }
                }
              }
            }
          }
          return color
        })
        /*
        .attr("fill", function (d) {
          let colorValue;
          let range;
          if (typeof d.data !== "undefined") {
            range = metric.metric                                
            colorValue= d.data[range] || 0;
          }
          return colorScale(colorValue);
        })
        */
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("click", (event, d) => {

        })
        .attr("data-toggle", "tooltip")
        .attr("data-placement", "top")
        .attr("title", d => d.properties.name)
        .append("svg:title")
        .text(d => d.properties.name)

    })
}

function drawChart(elm) {
  // chart svg: set the dimensions and margins of the graph
  $(elm).html("");
  var parentWidth = $(elm).width();
  var margin = {
      top: 10,
      right: 30,
      bottom: 30,
      left: 60
    },
    width = parentWidth - margin.left - margin.right,
    height = (parentWidth * .4) - margin.top - margin.bottom;
  // append the svg object to the body of the page
  var svg = d3.select(elm)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered.csv").then(function (data) {
    // group the data: I want to draw one line per group
    const sumstat = d3.group(data, d => d.name); // nest function allows to group the calculation per level of a factor

    // Add X axis --> it is a date format
    const x = d3.scaleLinear()
      .domain(d3.extent(data, function (d) {
        return d.year;
      }))
      .range([0, width]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .attr("class", "chart-axis")
      .attr("stroke-width", 1.5)
      .call(d3.axisBottom(x).ticks(5));
    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) {
        return +d.n;
      })])
      .range([height, 0]);
    svg.append("g")
      .attr("class", "chart-axis")
      .attr("stroke-width", 1.5)
      .call(d3.axisLeft(y));
    // color palette
    const color = d3.scaleOrdinal()
      .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'])
    // Draw the line
    svg.selectAll(".line")
      .data(sumstat)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", function (d) {
        return color(d[0])
      })
      .attr("stroke-width", 2.5)
      .attr("d", function (d) {
        return d3.line()
          .x(function (d) {
            return x(d.year);
          })
          .y(function (d) {
            return y(+d.n);
          })
          (d[1])
      })
  })
}
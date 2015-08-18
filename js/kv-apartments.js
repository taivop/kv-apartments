

ready = function(error, rows) {

    // Populate form with options
    features = {};
    features.parts_of_city = d3.map(rows, function(d){ return d.Linnaosa; }).keys().sort();
    features.parts_of_city.unshift("[Linnaosa]");
    features.apartment_states = d3.map(rows, function(d){ return d.Seisukord; }).keys().sort();
    features.apartment_states.unshift("[Korteri seisukord]");

    d3.select("select#part_of_city")
        .selectAll("option")
        .data(features.parts_of_city)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; })
    

    d3.select("select#apartment_state")
        .selectAll("option")
        .data(features.apartment_states)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; })

    // A formatter for counts.
    var formatCount = d3.format(",.0f");

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain([0, Math.max(300000, d3.min(rows, function(d) { return d.Hind }))])
        .range([0, width]);

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
        .bins(x.ticks(20))
        .value(function(d) { return d.Hind; })
    (rows);
    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    bar.append("rect")
        .attr("x", 1)
        .attr("width", x(data[0].dx) - 1)
        .attr("height", function(d) { return height - y(d.y); });

    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", 6)
        .attr("x", x(data[0].dx) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Update when inputs change
    d3.select("select#part_of_city").on("input", function() {
        console.log(this.value)
    });
}



rowParser = function(d) {
    return {
        ID: d.ID,
        Hind: parseFloat(d.HindKohandatud),
        Linnaosa: d.Linnaosa,
        Üldpind: d.Üldpind,
        Seisukord: d.Seisukord,
        Tube: parseInt(d.Tube),
        Korrus: parseInt(d.Korrus),
        Korruseid: parseInt(d.Korruseid)
    };
}

// Load data
var dsv = d3.dsv(";", "text/plain");
dsv("data/apartment_sell_tallinn_test.csv")
    .row(rowParser)
    .get(ready);
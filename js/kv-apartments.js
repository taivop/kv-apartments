
setMeanMedianText = function(mean, median) {
    d3.select("div#info span#mean")
        .text(Math.round(mean))
    d3.select("div#info span#median")
        .text(Math.round(median))
}

createGraph = function(rows) {
    x = d3.scale.linear()
        .domain([0, Math.min(1000000, d3.max(rows, function(d) { return d.Hind }))])
        .range([0, width]);

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
        .bins(x.ticks(20))
        .value(function(d) { return d.Hind; })
    (rows);
    y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([height, 0]);

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    svg = d3.select("body").select("svg")
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
        .attr("class", "barlabel")
        .attr("dy", ".75em")
        .attr("y", "-1em")
        .attr("x", x(data[0].dx) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Mean and median
    var mean = d3.mean(rows, function(d) { return d.Hind; })
    var median = d3.median(rows, function(d) { return d.Hind; })
    setMeanMedianText(mean, median);

    svg.append("line")
        .attr("id", "mean")
        .attr("x1", x(mean))
        .attr("x2", x(mean))
        .attr("y1", y(0))
        .attr("y2", y(d3.max(data, function(d) { return d.y; })))
        .attr("stroke", "red")
        .attr("stroke-dasharray", "5, 5")
        .attr("stroke-width", 1)

    svg.append("line")
        .attr("id", "median")
        .attr("x1", x(median))
        .attr("x2", x(median))
        .attr("y1", y(0))
        .attr("y2", y(d3.max(data, function(d) { return d.y; })))
        .attr("stroke", "red")
        .attr("stroke-width", 1)
}

updateGraph = function(rows) {
    // If no datapoints, show alert
    if (rows.length <= 0) {
        d3.select("div#alert span#message")
            .style("display", "block")
            .text("Kriteeriumidele ei vastanud ükski kuulutus.")
        return;
    } else {
        d3.select("div#alert span#message")
            .style("display", "none")
            .text("")
    }

    x.domain([0, Math.min(1000000, d3.max(rows, function(d) { return d.Hind }))]);

    var data = d3.layout.histogram()
        .bins(x.ticks(20))
        .value(function(d) { return d.Hind; })
    (rows);

    y.domain([0, d3.max(data, function(d) { return d.y; })])

    var update_delay = 100;

    var bars = svg.selectAll(".bar")
        .data(data)
        .transition()
        .delay(update_delay)
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })

    svg.selectAll(".bar")
        .data(data)
        .exit()
        .remove()


    svg.selectAll("rect")
        .data(data)
        .transition()
        .delay(update_delay)
        .attr("width", x(data[0].dx) - 1)
        .attr("height", function(d) { return height-y(d.y); });

    svg.selectAll("text.barlabel")
        .data(data)
        .transition()
        .delay(update_delay)
        .attr("x", x(data[0].dx) / 2)
        .text(function(d) { return formatCount(d.y); });

    xAxis.scale(x)

    svg.selectAll("g.x.axis")
        .transition()
        .delay(update_delay)
        .call(xAxis);

    // Mean and median
    var mean = d3.mean(rows, function(d) { return d.Hind; })
    var median = d3.median(rows, function(d) { return d.Hind; })

    svg.select("line#mean")
        .transition()
        .delay(update_delay)
        .attr("x1", x(mean))
        .attr("x2", x(mean))

    svg.select("line#median")
        .transition()
        .delay(update_delay)
        .attr("x1", x(median))
        .attr("x2", x(median))
}

getFilteredRows = function(rows) {
    var s1 = document.getElementById("part_of_city");
    var part_of_city = s1.options[s1.selectedIndex].value;
    var s2 = document.getElementById("apartment_state");
    var apartment_state = s2.options[s2.selectedIndex].value;
    var total_area = +document.getElementById("total_area").value;
    var rooms_min = +document.getElementById("num_rooms_min").value;
    var rooms_max = +document.getElementById("num_rooms_max").value;
    var num_floor = +document.getElementById("num_floor").value;
    var num_floors_total = +document.getElementById("num_floors_total").value;


    var filtered_rows = rows
        .filter(function(d) {
            if (part_of_city == "[Linnaosa]")
                return true;
            else
                return d.Linnaosa==part_of_city;
        })
        .filter(function(d) {
            if (apartment_state == "[Korteri seisukord]")
                return true;
            else
                return d.Seisukord == apartment_state;
        })
        .filter(function(d) {
            if (total_area == 0)
                return true;
            else
                return d.Üldpind >= 0.8 * total_area && d.Üldpind <= 1.2 * total_area;
        })
        .filter(function(d) {
            return d.Tube >= rooms_min;
        })
        .filter(function(d) {
            if (rooms_max == 0)
                return true;
            else
                return d.Tube <= rooms_max;
        })
        .filter(function(d) {
            if (num_floor == 0)
                return true;
            else
                return d.Korrus == num_floor;
        })
        .filter(function(d) {
            if (num_floors_total == 0)
                return true;
            else
                return d.Korruseid == num_floors_total;
        })

    return filtered_rows;
}


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
    formatCount = d3.format(",.0f");

    margin = {top: 20, right: 30, bottom: 30, left: 30},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    createGraph(rows);

    // Update when inputs change
    d3.select("select#part_of_city").on("input", function() {
        updateGraph(getFilteredRows(rows));
    });
    d3.select("select#apartment_state").on("input", function() {
        updateGraph(getFilteredRows(rows));
    });
    d3.select("input#total_area").on("focusout", function() {
        updateGraph(getFilteredRows(rows));
    });
    d3.select("input#num_rooms_min").on("focusout", function() {
        updateGraph(getFilteredRows(rows));
    });
    d3.select("input#num_rooms_max").on("focusout", function() {
        updateGraph(getFilteredRows(rows));
    });
    d3.select("input#num_floor").on("focusout", function() {
        updateGraph(getFilteredRows(rows));
    });
    d3.select("input#num_floors_total").on("focusout", function() {
        updateGraph(getFilteredRows(rows));
    });
    d3.select("#submit_form").on("click", function() {
        updateGraph(getFilteredRows(rows));
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
        Korruseid: parseInt(d.Korruseid),
        Kuupäev: new Date(d.Kuupäev)
    };
}

// Load data
var dsv = d3.dsv(";", "text/plain");
dsv("data/apartment_sell_tallinn.csv")
    .row(rowParser)
    .get(ready);
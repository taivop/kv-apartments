
setMeanMedianText = function(mean, median) {
    d3.select("div#info span#mean")
        .text(formatPrice(Math.round(mean)))
    d3.select("div#info span#median")
        .text(formatPrice(Math.round(median)))
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

updateSamplesTable = function(rows) {

    // Sample dataset for rows
    /*var rows_copy = rows.slice()
     rows_copy = rows_copy.sort( function() { return 0.5 - Math.random() } );
     var sampled_rows = rows_copy.slice(0, Math.min(20, rows_copy.length))*/
    var rows_copy = rows.slice()
     rows_copy = rows_copy.sort( function(d1, d2) { return d2.Kuupäev - d1.Kuupäev } );
     var sampled_rows = rows_copy.slice(0, Math.min(20, rows_copy.length))

    transition_duration = 400
    transition_duration_step = 20;

    var table_rows = d3.select("table#samples tbody")
        .selectAll(".generated_row")
        .data(sampled_rows, function(d) { return d.ID; }) // Bind by ad ID

    table_rows
        .exit()
        .transition()
        .duration(transition_duration)
        .style("color", "white")
        .remove()

    var table_rows_enter = table_rows
        .enter()
        .append("tr")
        .attr("class", "generated_row")

    d3.selectAll("table tr.generated_row")
        .style("color", "white")
        .transition()
        .duration(function(d, i) { return transition_duration + i * transition_duration_step; })
        .style("color", "black")

    d3.selectAll("tr.generated_row").selectAll("a")
        .style("color", "white")
        .transition()
        .duration(function(d, i) { return transition_duration + i * transition_duration_step; })
        .style("color", "black")

    table_rows_enter
        .append("td")
        .append("a")
        .attr("href", function(d) { return "http://kv.ee/" + d.ID; })
        .text(function(d) {return d.ID})

    table_rows_enter
        .append("td")
        .text(function(d) {return d.Hind})

    table_rows_enter
        .append("td")
        .text(function(d) {return d.Linnaosa})

    table_rows_enter
        .append("td")
        .text(function(d) {return d.Üldpind })

    table_rows_enter
        .append("td")
        .text(function(d) {return d.Seisukord})

    table_rows_enter
        .append("td")
        .text(function(d) {return d.Tube} )

    table_rows_enter
        .append("td")
        .text(function(d) {return d.Korrus + "/" + d.Korruseid})

    /*ID: d.ID,
     Hind: parseFloat(d.HindKohandatud),
     Linnaosa: d.Linnaosa,
     Üldpind: d.Üldpind,
     Seisukord: d.Seisukord,
     Tube: parseInt(d.Tube),
     Korrus: parseInt(d.Korrus),
     Korruseid: parseInt(d.Korruseid),
     Kuupäev: new Date(d.Kuupäev)*/
}

createGraph = function(rows) {

    // Need to filter at first because ad type is set to rentals
    rows = rows.filter(function(d) {
            return d.Tüüp=="Anda üürile";
        })

    var sorted_by_price = rows.sort(function(d1, d2) { return d1.Hind - d2.Hind; });
    var cutoff_index = Math.floor(sorted_by_price.length * 0.99);
    var x_upper_limit = sorted_by_price[cutoff_index].Hind;

    x = d3.scale.linear()
        .domain([0, x_upper_limit])
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

    // x axis label
    svg.append("text")
        .text("Hind, €")
        .attr({"x": width/2, "y": height + 30, "text-anchor": "middle"})
        .style("font-weight", "bold")

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

    updateSamplesTable(rows);
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

    // Select colour based on ad type
    colour_rentals = "#ffc29e";
    colour_sales = "#9cc0ef";
    var s3 = document.getElementById("type_of_ad");
    var type_of_ad = s3.options[s3.selectedIndex].value;
    var colour_bars = colour_sales;
    if(type_of_ad == "Anda üürile")
        colour_bars = colour_rentals;



    var sorted_by_price = rows.sort(function(d1, d2) { return d1.Hind - d2.Hind; });
    var cutoff_index = Math.floor(sorted_by_price.length * 0.99);
    var x_upper_limit = sorted_by_price[cutoff_index].Hind;
    
    x.domain([0, x_upper_limit]);

    var data = d3.layout.histogram()
        .bins(x.ticks(20))
        .value(function(d) { return d.Hind; })
    (rows);

    y.domain([0, d3.max(data, function(d) { return d.y; })])

    var update_duration = 500;

    var bar = svg.selectAll("g.bar")
        .data(data)

    bar
        .transition()
        .duration(update_duration)
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })

    bar_exit = bar.exit()
    bar_exit
        .transition()
        .duration(update_duration)
        .attr("transform", function(d) { return "translate(" + (width + x(d.x)) + "," + height + ")"; })
        .remove()
    bar_exit.selectAll("rect")
        .transition()
        .duration(update_duration)
        .attr("height", "0")


    bar_enter = bar.enter()
        .append("g")
        .attr("class", "bar")
    bar_enter
        .attr("transform", function(d) { return "translate(" + (width + x(d.x)) + "," + y(d.y) + ")"; })
        .transition()
        .duration(update_duration)
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })
    bar_enter
        .append("rect")
        .attr("x", 1)
        .attr("width", x(data[0].dx) - 1)
        .attr("height", function(d) { return height - y(d.y); })
        .style("fill", colour_bars)
    bar_enter
        .append("text")
        .attr("class", "barlabel")
        .attr("dy", ".75em")
        .attr("y", "-1em")
        .attr("x", x(data[0].dx) / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatCount(d.y); });



    svg.selectAll("rect")
        .data(data)
        .transition()
        .duration(update_duration)
        .style("fill", colour_bars)
        .attr("width", x(data[0].dx) - 1)
        .attr("height", function(d) { return height-y(d.y); });

    svg.selectAll("text.barlabel")
        .data(data)
        .transition()
        .duration(update_duration)
        .attr("x", x(data[0].dx) / 2)
        .text(function(d) { return formatCount(d.y); });

    xAxis.scale(x)

    svg.selectAll("g.x.axis")
        .transition()
        .duration(update_duration)
        .call(xAxis);

    // Mean and median
    var mean = d3.mean(rows, function(d) { return d.Hind; })
    var median = d3.median(rows, function(d) { return d.Hind; })
    setMeanMedianText(mean, median);

    svg.select("line#mean")
        .moveToFront()
    svg.select("line#median")
        .moveToFront()

    svg.select("line#mean")
        .transition()
        .duration(update_duration)
        .attr("x1", x(mean))
        .attr("x2", x(mean))

    svg.select("line#median")
        .transition()
        .duration(update_duration)
        .attr("x1", x(median))
        .attr("x2", x(median))

    updateSamplesTable(rows);
}

getFilteredRows = function(rows) {
    var s1 = document.getElementById("part_of_city");
    var part_of_city = s1.options[s1.selectedIndex].value;
    var s2 = document.getElementById("apartment_state");
    var apartment_state = s2.options[s2.selectedIndex].value;
    var s3 = document.getElementById("type_of_ad");
    var type_of_ad = s3.options[s3.selectedIndex].value;
    var total_area = +document.getElementById("total_area").value;
    var rooms_min = +document.getElementById("num_rooms_min").value;
    var rooms_max = +document.getElementById("num_rooms_max").value;
    var num_floor = +document.getElementById("num_floor").value;
    var num_floors_total = +document.getElementById("num_floors_total").value;

    console.log(type_of_ad);

    var filtered_rows = rows
        .filter(function(d) {
            return d.Tüüp==type_of_ad;
        })
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
    features.ad_types = d3.map(rows, function(d){ return d.Tüüp; }).keys().sort();


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

    d3.select("select#type_of_ad")
        .selectAll("option")
        .data(features.ad_types)
        .enter()
        .append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; })

    // A formatter for counts.
    formatCount = d3.format(",.0f");
    formatPrice = d3.format(",.0f");

    margin = {top: 20, right: 30, bottom: 50, left: 30},
        width = 700 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    createGraph(rows);

    // Update when inputs change
    d3.select("select#type_of_ad").on("input", function() {
        updateGraph(getFilteredRows(rows));
    });
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



// Get and unzip data file
JSZipUtils.getBinaryContent('data/apartment_both_tartu.csv.zip', function(err, data) {
    if(err) {
        throw err; // or handle err
    }

    var zip = new JSZip(data);
    csv_string = zip.file("apartment_both_tartu.csv").asText();

    // Load data
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
            Kuupäev: new Date(d.Kuupäev),
            Tüüp: d.Tüüp
        };
    }

    // Parse csv
    var dsv = d3.dsv(";", "text/plain");
    var rows = dsv.parse(csv_string, rowParser)
    console.log(rows.length + " rows")
    // Fire away
    ready(undefined, rows)
});
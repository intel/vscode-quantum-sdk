function runD3(histogramData) {

    const maxProb = Math.max(...histogramData.map(item => parseFloat(item.probability)));
    const maxHeight = Math.min(maxProb * 1.15, 1)

    var xScale = d3.scaleBand().domain(histogramData.map((dataPoint) => dataPoint.value)).rangeRound([100, 1500]).padding(0.1)
    const yScale = d3.scaleLinear().domain([0, 1]).range([900, 50])

    
    // const buttonContainer = d3.select('#options')
    
    // buttonContainer
    // .append('button')
    // .text('Descending Order')
    
    // let order = true
    // buttonContainer.on("click", function() {
    //     if (order) {
    //         histogramData.sort((a,b) => d3.descending(a.probability, b.probability))
    //         order = false
    //     } else  {
    //         histogramData.sort((a,b) => d3.ascending(a.value, b.value))
    //         order = true
    //     }
    //     // console.log(histogramData)
    //     // console.log("TEST")
    //     // xScale = d3.scaleBand().domain(histogramData.sort((a,b) => d3.descending(a.probability, b.probability)).map((dataPoint) => dataPoint.value)).rangeRound([100, 1500]).padding(0.1)
    //     updateBars()
    // })

    const graphContainer = d3.select("#histogram")

    graphContainer
        .append('rect')
        .classed('background', true)
        .attr('width', '1500px')
        .attr('height', '1000px')

    // Add labels to the bars
    graphContainer
        .selectAll('.labelX')
        .data(histogramData)
        .enter()
        .append('text')
        .classed('labelX', true)
        .text(data => data.value)
        .attr('x', data => xScale(data.value) + xScale.bandwidth() / 2)
        .attr('y', 950)

    graphContainer
        .selectAll('.line')
        .data(d3.range(11).map((i) => i * 10))
        .enter()
        .append('line')
        .classed('line', true)
        .attr('x1', 120)
        .attr('x2', 1480)
        .attr('y1', data => 900 - ((data / 100) * 850))
        .attr('y2', data => 900 - ((data / 100) * 850))

    graphContainer
        .selectAll('.labelY')
        .data(d3.range(11).map((i) => i * 10))
        .enter()
        .append('text')
        .classed('labelY', true)
        .text(data => data + '%')
        .attr('x', 100)
        .attr('y', data => 900 - ((data / 100) * 850))

    graphContainer
        .selectAll('.bar')
        .data(histogramData)
        .enter()
        .append('rect')
        .classed('bar', true)
        .attr('width', xScale.bandwidth())
        .attr('height', data => 900 - yScale(data.probability) + 2)
        .attr('x', data => xScale(data.value))
        .attr('y', data => yScale(data.probability) - 1)

    function updateBars() {
    
        //tempX = d3.scaleBand().domain(histogramData.map((dataPoint) => dataPoint.value)).rangeRound([100, 1500]).padding(0.1)
        console.log(histogramData)
        console.log(xScale('001'))
        graphContainer
            .selectAll(".bar")
            .data(histogramData)
            .transition()
            .attr('x', data => xScale(data.value))

        graphContainer
            .selectAll('.labelX')
            .data(histogramData)
            .transition()
            .attr('x', data => xScale(data.value) + xScale.bandwidth() / 2)
    }

}
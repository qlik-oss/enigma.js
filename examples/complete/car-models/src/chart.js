/* eslint-env browser */
/* eslint import/no-unresolved:0, import/extensions:0 */

import * as d3 from 'd3';

let currentTooltip = null;

function hideTooltip() {
  if (currentTooltip) {
    document.body.removeChild(currentTooltip);
    currentTooltip = null;
  }
}

function showTooltip(text, point) {
  currentTooltip = document.createElement('div');
  currentTooltip.appendChild(document.createTextNode(text));
  currentTooltip.style.position = 'absolute';
  currentTooltip.style.top = '-99999px';
  currentTooltip.style.left = '-99999px';
  currentTooltip.classList.add('tooltip');

  document.body.appendChild(currentTooltip);

  // Reposition the tooltip
  currentTooltip.style.top = `${point.y}px`;
  currentTooltip.style.left = `${(point.x - currentTooltip.clientWidth) / 2}px`;
}

export default function paintBarchart(element, layout) {
  if (!(layout.qHyperCube &&
    layout.qHyperCube.qDataPages &&
    layout.qHyperCube.qDataPages[0] &&
    layout.qHyperCube.qDataPages[0].qMatrix)
  ) {
    return;
  }

  function setNaNToZero(value) {
    return isNaN(value) ? 0 : value;
  }

  function roundNumber(value, nrDecimals) {
    const multiplier = 10 ** nrDecimals;
    return Math.round(value * multiplier) / multiplier;
  }

  const nbrDecimals = 1;
  const data = layout.qHyperCube.qDataPages[0].qMatrix.map(item => ({
    name: item[0].qText,
    value: roundNumber(setNaNToZero(item[1].qNum), nbrDecimals),
  }));
  const width = element.offsetWidth - 30; // -30 due to possible scrollbar
  const barHeight = 20;

  const x = d3.scaleLinear().range([0, width]);

  const chart = d3.select(element.querySelector('svg')).attr('width', width);

  chart.selectAll('*').remove();

  x.domain([0, d3.max(data, d => d.value)]);

  chart.attr('height', barHeight * data.length);

  const bar = chart.selectAll('g')
    .data(data)
    .enter().append('g')
    .attr('transform', (d, i) => `translate(0,${i * barHeight})`);

  bar.append('text')
    .attr('class', 'right')
    .attr('x', 0)
    .attr('y', barHeight / 2)
    .attr('dy', '.35em')
    .text(d => d.name);

  bar.append('rect')
    .style('fill', '#4477aa')
    .attr('x', 150)
    .attr('width', d => x(d.value))
    .attr('height', barHeight - 1);

  if (layout.labels) {
    bar.append('text')
      .style('fill', 'white')
      .attr('x', 153)
      .attr('y', barHeight / 2)
      .attr('dy', '.35em')
      .text(d => (x(d.value) > 25 * nbrDecimals ? d.value : ''));
  }

  bar.on('mouseover', (dataPoint) => {
    const event = d3.event;
    const text = `${dataPoint.name}: ${dataPoint.value}`;
    const point = {
      y: event.pageY - 38,
      x: event.pageX,
    };
    showTooltip(text, point);
  });

  bar.on('mouseout', () => {
    hideTooltip();
  });
}

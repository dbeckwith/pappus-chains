function vadd(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
function vsub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
function vmul(a, b) { return { x: a.x * b, y: a.y * b }; }
function vdiv(a, b) { return { x: a.x / b, y: a.y / b }; }
function vmagsq(a) { return a.x * a.x + a.y * a.y; }
function vmag(a) { return Math.sqrt(vmagsq(a)); }
function vnorm(a) { return vdiv(a, vmag(a)); }
function vperp(a) { return { x: a.y, y: -a.x }; }

$(function () {

  var canvasWidth = window.innerWidth;
  var canvasHeight = 800;
  var canvasSize = Math.min(canvasWidth, canvasHeight);
  var canvasRadius = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight) / 2;

  var canvas = d3.select('#canvas');
  canvas.attr('width', canvasWidth);
  canvas.attr('height', canvasHeight);

  function invert(mirror, object) {
    var dCenter = vsub(object.center, mirror.center);
    var dCenterMagSq = vmagsq(dCenter);
    if (object.type == 'circle') {
      var sdenom = dCenterMagSq - object.radius * object.radius;
      if (sdenom == 0) {
        var dCenterMag = Math.sqrt(dCenterMagSq);
        var s = mirror.radius * mirror.radius / (dCenterMag + object.radius);
        var dir = vdiv(dCenter, dCenterMag);
        return { type: 'line', center: vadd(mirror.center, vmul(dir, s)), direction: vperp(dir) };
      }
      else {
        var s = mirror.radius * mirror.radius / sdenom;
        return { type: 'circle', center: vadd(mirror.center, vmul(dCenter, s)), radius: Math.abs(s) * object.radius };
      }
    }
    else if (object.type == 'line') {
      if (dCenterMagSq == 0) {
        return { type: 'line', center: object.center, direction: object.direction };
      }
      else {
        var dCenterMag = Math.sqrt(dCenterMagSq);
        var s = mirror.radius * mirror.radius / dCenterMag;
        var r = s / 2;
        var dir = vdiv(dCenter, dCenterMag);
        return { type: 'circle', center: vadd(mirror.center, vmul(dir, r)), radius: r };
      }
    }
  }

  function radiusRatio(n, r, a, b) {
    var a = n - 1 + a;
    var b = b + 1;
    return (a * a + b * b) / (2 * r) - r / 2;
  }

  var MIRROR_RADIUS = canvasSize / 2;
  var CHAIN_LEN = 40;
  var CHAIN_DIR = vnorm({ x: 0, y: -1 });

  var mirror = { type: 'circle', center: { x: 0, y: MIRROR_RADIUS }, radius: MIRROR_RADIUS };
  var inversionCircles = [];
  inversionCircles.push({
    object: {
      type: 'line',
      center: vadd(mirror.center, vmul(CHAIN_DIR, MIRROR_RADIUS / 2)),
      direction: vperp(CHAIN_DIR)
    },
    stroke: 'darkorange'
  });
  inversionCircles.push({
    object: {
      type: 'line',
      center: vadd(mirror.center, vmul(CHAIN_DIR, MIRROR_RADIUS)),
      direction: vperp(CHAIN_DIR)
    },
    stroke: 'orangered' 
  });
  var chains = [
    { r: 1/2, a: 0, b: 1/2, color: 'darkred' },
    { r: 1/8, a: 1/2, b: 1/8, color: 'blue' },
    { r: 1/8, a: 1/2, b: 7/8, color: 'cyan' }
  ];
  // var heights = [1/8, 7/8];
  [-1, 1].forEach(function (dir) {
    for (var i = 0; i < CHAIN_LEN; i++) {
      var n = i + 1;
      chains.forEach(function (chain) {
        if (!(chain.a == 0 && i == 0 && dir == -1)) {
          inversionCircles.push({
            object: {
              type: 'circle',
              center: vadd(mirror.center, vadd(vmul(CHAIN_DIR, (1 + chain.b) * MIRROR_RADIUS / 2), vmul(vperp(CHAIN_DIR), (i + chain.a) * MIRROR_RADIUS / 2 * dir))),
              radius: chain.r * MIRROR_RADIUS / 2
            },
            stroke: chain.color,
            radiusRatio: radiusRatio(n, chain.r, chain.a, chain.b)
          });
        }
      });
      // if (!(i == 0 && dir == -1)) {
      //   inversionCircles.push({
      //     object: {
      //       type: 'circle',
      //       center: vadd(mirror.center, vadd(vmul(CHAIN_DIR, 3 * MIRROR_RADIUS / 4), vmul(vperp(CHAIN_DIR), i * MIRROR_RADIUS / 2 * dir))),
      //       radius: MIRROR_RADIUS / 4
      //     },
      //     stroke: 'darkred',
      //     radiusRatio: radiusRatio(n, 1/2, 0, 1/2) //n * (n - 2) + 3
      //   });
      // }
      // heights.forEach(function (h) {
      //   inversionCircles.push({
      //     object: {
      //       type: 'circle',
      //       center: vadd(mirror.center, vadd(vmul(CHAIN_DIR, (h/2 + 1/2) * MIRROR_RADIUS), vmul(vperp(CHAIN_DIR), (i * MIRROR_RADIUS / 2 + MIRROR_RADIUS / 4) * dir))),
      //       radius: MIRROR_RADIUS / 16
      //     },
      //     stroke: 'blue',
      //     radiusRatio: radiusRatio(n, 1/8, 1/2, h) //4 * n * (n - 1) + (h * h - 1) / 16 + 1
      //   });
      // });
    }
  });

  var allCircles = [];
  inversionCircles.forEach(function (c) {
    allCircles.push({
      object: invert(mirror, c.object),
      // stroke: c.stroke,
      fill: c.stroke,
      radiusRatio: c.radiusRatio,
      result: true
    });
  });
  allCircles = allCircles.concat(inversionCircles);
  allCircles.push({ object: mirror, stroke: 'green' });

  var objects = canvas.append('g')
    .classed('objects', true)
    .attr('transform', 'translate(' + (canvasWidth/2) + ',' + (canvasHeight/2) + ')')
    .selectAll('.object')
    .data(allCircles);

  objects.enter()
    .append('g')
    .classed('object', true)
    .each(function (d) {
      d3.select(this)
        .attr('transform', function (d) { return 'translate(' + d.object.center.x + ',' + d.object.center.y + ')'; })
        .classed('result', function (d) { return d.result; })
        .classed('construction', function (d) { return !d.result; });
      if (d.object.type == 'circle') {
        d3.select(this)
          .append('circle')
          .attr('fill', function (d) { return d.fill || 'none'; })
          .attr('stroke', function (d) { return d.stroke || 'none'; })
          .attr('r', function (d) { return d.object.radius; });
      }
      else if (d.object.type == 'line') {
        d3.select(this)
          .append('line')
          .attr('stroke', function (d) { return d.stroke || 'none'; })
          .attr('x1', function (d) { return -d.object.direction.x * canvasRadius; })
          .attr('y1', function (d) { return -d.object.direction.y * canvasRadius; })
          .attr('x2', function (d) { return +d.object.direction.x * canvasRadius; })
          .attr('y2', function (d) { return +d.object.direction.y * canvasRadius; });
      }
      if (d.radiusRatio) {
        d3.select(this)
          .append('text')
          .text(function (d) { return d.radiusRatio; })
          .attr('transform', function (d) {
            var bbox = this.getBBox();
            var radius = Math.sqrt(bbox.width * bbox.width + bbox.height * bbox.height) / 2;
            return 'scale(' + (d.object.radius / radius) + ')';
          });
        d3.select(this)
          .append('title')
          .text(function (d) { return d.radiusRatio; });
      }
    });

  var constructionHidden = true;
  $construction = $('#canvas .construction');
  $hideConstructionButton = $('#hide-construction-button');
  $hideConstructionButton.click(function () {
    if (constructionHidden) {
      $construction.fadeIn();
      $(this).val('Hide Construction');
    }
    else {
      $construction.fadeOut();
      $(this).val('Show Construction');
    }
    constructionHidden = !constructionHidden;
  });
  $construction.hide();
  $hideConstructionButton.val('Show Construction');

});

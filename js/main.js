function GenerateSVG (_options) {
    var
        self = {},

        // drawing props
        minDeg = 0,
        maxDeg = Math.PI,
        center = [0, 0],
        radius = 49,
        labelRadius = 40,

        // SVG dom elements
        $sectors = null,
        $ticks = null,
        $labels = null;



    function mergeOptions() {
        var defaults = {
            name: '',
            units: '',
            type: 1,

            min: 0,
            max: 100,
            value: 0,

            sectors: [],

            formatter: function(val, presice) {
                presice = presice || 4;
                return +(val).toFixed(presice);
            },
            //
            ticks: 100
        };
        // merge
            self.options = _.extend({}, defaults, _options);
    }

    /** init svg element
     */
    function init() {
        var background, foreground, arrow, labelX = 50, labelY = 50;

        var arrColor = '#f00';
        var bgColor = '#000';

        arrow = '<path class="arrow" fill="' + arrColor + '" stroke-width="0.4" stroke="#700" style="transition: transform 0.4s ease-out;" ';

        switch (self.options.type) {
            case 0:
                minDeg = 0;
                maxDeg = Math.PI / 2;
                center = [47, 47];
                radius = 94;
                labelRadius = 79;
                labelX = 70;
                labelY = 60;
                //transform-origin="97 97"
                background = '<path fill="' + bgColor + '" d="M 98 98 L 98 2 A 95 95 0 0 0 2 98 L 97 98"></path>';
                foreground = '<path fill="' + bgColor + '" d="M 98 98 L 98 28 A 70 70 0 0 0 28 98 L 98 98"></path>';
                arrow += 'd="M97 98.5 A1.5 1.5 0 0 0 97 95.5 L 20 96.6 A0.4 0.4 0 0 0 20 97.6 Z"></path>';
                break;
            case 1:
                minDeg = 0;
                maxDeg = Math.PI;
                center = [0, 25];
                labelY = 58;
                labelRadius = 38;
                background = '<path fill="' + bgColor + '" d="M 50 76 L 100 76 L 100 75 A 50 50 0 0 0 0 75 L 0 75 L 0 76 Z"></path>';
                foreground = '<path fill="' + bgColor + '" d="M 50 76 L 80 76 A 30 30 0 0 0 20 76 L 50 76"></path>';
                arrow += 'd="M50 76.5 A1.5 1.5 0 0 0 50 73.5 L 10 74.6 A0.4 0.4 0 0 0 10 75.4 Z"></path>';
                break;
            case 2:
                minDeg = - 4 * Math.PI / 9 ;
                maxDeg = 13 * Math.PI / 9;
                labelY = 44;
                background = '<circle cx="50" cy="50" r="50" fill="' + bgColor + '" />'
                foreground = '<circle cx="50" cy="50" r="30" fill="' + bgColor + '" />'
                arrow += 'd="M50 51.5 A1.5 1.5 0 0 0 50 48.5 L 10 49.6 A0.4 0.4 0 0 0 10 50.4 Z"></path>';
                break;
            default:
                console.warn('Unsopported type', self.options.type)
        }

        self.wrapper = document.createElement('div');
        self.wrapper.style.cssText = 'width:100%;height:100%;';
        self.wrapper.setAttribute('class', 'indicator-body');
        self.element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        self.element.setAttributeNS(null, 'viewBox', self.options.type === 1 ? '0 25 100 50' : '0 0 100 100');
        self.element.setAttributeNS(null, 'width', '190');
        self.element.setAttributeNS(null, 'height', '190');
        self.element.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        self.element.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        // self.element.setAttribute('xmlns:ev', 'http://www.w3.org/2001/xml-events');
        self.element.setAttribute('xml:space', 'preserve');
        self.element.setAttributeNS(null, 'class', 'indicator-body');

        var name = self.options.name;
        if (name.length > 19) {
            name = name.substring(0, 19) + '…';
        }

        var dy = 12 + (self.options.type == 2 ? 7 : 0);

        var html =
            background +
            '<g class="sectors"></g>' +
            '<g class="ticks"></g>' +
            '<g class="labels"></g>' +
            foreground +
            '<text class="sensor-name" font-family="Arial" text-anchor="middle" font-size="6" x="' + labelX + '" y="' + labelY + '" fill="white">' + name + '</text>' +
            '<text class="sensor-val" font-family="Arial" text-anchor="middle" font-size="12" x="' + labelX + '" y="' + (labelY + dy) + '" fill="white"></text>' +
            arrow;

        $(self.wrapper).append(self.element);
        $(self.element).append(html);

        $sectors = self.wrapper.querySelector('.sectors');
        $sectors.setAttribute('transform', 'translate(50 50)');

        $ticks = self.wrapper.querySelector('.ticks');
        $ticks.setAttribute('transform', 'translate(50 50)');

        $labels = self.wrapper.querySelector('.labels');
        $labels.setAttribute('transform', 'translate(50 50)');

        // draw svg
        redraw();
    }
    mergeOptions(_options);
    init();

    function clear() {
        $sectors = self.wrapper.querySelector('.sectors');
        $($sectors).empty();

        $labels = self.wrapper.querySelector('.labels');
        $($labels).empty();

        $ticks = self.wrapper.querySelector('.sectors');
        $($ticks).empty();
    }

    function redraw() {
        clear();

        var $path, i, delta, num, step;

        var degree = maxDeg - minDeg;

        // draw sectors
        var fromDeg = minDeg;
        for (i = 0; i < self.options.sectors.length; i++) {
            var sector = self.options.sectors[i];

            var color = self.options.sectors[i].color || "red";
            var toDeg = getDegree(sector.value) || maxDeg;

            $path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            $path.setAttributeNS(null, 'd', createSvgArc(center, radius, fromDeg, toDeg));
            $path.setAttributeNS(null, 'fill', color);
            $path.setAttributeNS(null, 'stroke', color);
            $path.setAttributeNS(null, 'stroke-width', 0.1);
            $sectors.appendChild($path);

            fromDeg = toDeg;
        }

        // draw ticks
        step = (self.options.max - self.options.min) / self.options.ticks;
        delta = degree / self.options.ticks;

        if (step === 0) {
            step = 0.00001;
        }

        i = 0;
        while (self.options.min + i * step <= self.options.max) {
            $path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            var r1 = radius * (i%10 ? (i%5 ? 0.96 : 0.94) : 0.92);
            var r2 = radius;

            $path.setAttribute('d', createLine(center, r1, r2, minDeg + delta * i));
            $path.setAttribute('stroke', '#fff');
            $path.setAttribute('stroke-width', i%5 ? 0.6 : 0.8);
            $ticks.appendChild($path);
            i++;
        }

        // labels
        i = 0;
        while (self.options.min + i * step  <= self.options.max + step/10) {
            if (i % 10) {
                i++;
                continue;
            }

            var angle = Math.PI - (minDeg + i * delta);
            var x = labelRadius * Math.cos(angle) + center[0];
            var y = - labelRadius * Math.sin(angle) + center[1];

            $path = document.createElementNS('http://www.w3.org/2000/svg', 'text');

            var fontSize = 5;
            if (self.options.type == 2) {
                fontSize = 6;
                $path.setAttribute('dy', 2);
            }

            $path.setAttribute('x', x.toFixed(1));
            $path.setAttribute('y', y.toFixed(1));
            $path.setAttribute('fill', '#fff');
            $path.setAttribute('font-size', fontSize);

            $path.setAttribute('text-anchor', 'middle');
            $path.setAttribute('font-family', 'Arial');
            $path.setAttribute('font-weight', 'bolder');

            if (i == 0) {
                // first point
                switch (self.options.type) {
                    case 0:
                        $path.setAttribute('dy', -1);
                        break;
                    case 1:
                        $path.setAttribute('dy', -1);
                        break;
                    case 2:
                        $path.setAttribute('dx', -2);
                        break;
                }
            } else if (self.options.min + (i + 1) * step > self.options.max + step/10) {
                // last point
                switch (self.options.type) {
                    case 0:
                        $path.setAttributeNS(null, 'dx', -2);
                        break;
                    case 1:
                        $path.setAttributeNS(null, 'dy', -1);
                        break;
                    case 2:
                        $path.setAttributeNS(null, 'dx', 2);
                        break;
                }
            }

            // calculate value
            $path.textContent = self.options.formatter(self.options.min + i * step);
            $labels.appendChild($path);
            i++;
        }

        // update arrow (value)
        setValue(self.options.value);

        $(self.wrapper).html($(self.wrapper).html());
    }

    function createSvgArc (center, r, startAngle, endAngle) {
        startAngle = Math.PI - startAngle;
        endAngle = Math.PI - endAngle;

        var x = center[0], y = center[1];

        if(startAngle > endAngle){
            var s = startAngle;
            startAngle = endAngle;
            endAngle = s;
        }

        if (endAngle - startAngle > Math.PI*2 ) {
            endAngle = Math.PI * 1.999999;
        }

        var largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;

        return [
            'M', x, y,
            'L', (x + r * Math.cos(startAngle)).toFixed(1), (y - r * Math.sin(startAngle)).toFixed(1),
            'A', r, r, 0, largeArc, 0, (x + r * Math.cos(endAngle)).toFixed(1), (y - r * Math.sin(endAngle)).toFixed(1),
            'L', x, y
        ].join(' ');
    }

    function createLine(center, r1, r2, angle) {
        var x = center[0], y = center[1];

        angle = Math.PI - angle;
        return [
            'M', (x + r1 * Math.cos(angle)).toFixed(1), (y - r1 * Math.sin(angle)).toFixed(1),
            'L', (x + r2 * Math.cos(angle)).toFixed(1), (y - r2 * Math.sin(angle)).toFixed(1)
        ].join(' ');
    }

    function getDegree(val) {
        var result = null;
        if (self.options.min <= val && val <= self.options.max) {
            result = minDeg + (val - self.options.min) * (maxDeg - minDeg) / (self.options.max - self.options.min);
        }
        return result;
    }

    function setValue(val) {
        var arrow = $(self.wrapper).find('.arrow:first');
        if (self.options.invalidateText) {
            arrow.hide();
            $(self.wrapper).find('.sensor-val').innerHTML = self.options.invalidateText;
        } else {
            arrow.show();
            var cx = center[0] + 50;
            var cy = center[1] + 50;
            var deg = val;

            if (self.options.min > val) {
                deg = self.options.min;
            } else if (self.options.max < val) {
                deg = self.options.max;
            }
            deg = getDegree(deg) * 180 / Math.PI;

            arrow.attr('transform', 'rotate(' + deg + ', ' + cx + ', ' + cy + ')');

            // $(self.wrapper).find('.arrow')[0].setAttributeNS(null, 'transform', 'rotate(' + deg + ', ' + cx  + ', ' + cy + ')');
            $(self.wrapper).find('.sensor-val').text(self.options.formatter(val, 2) + (self.options.units ? ' ' + self.options.units : ''));
        }
    }

    // public functions
    self.redraw = redraw;
    self.setValue = setValue;

    return self;
};

'use strict';
/* jshint unused: false */
function getPalette() {
	return [
		['#ffff66', '#ffcc00', '#ff9933', '#ff6633'],
		['#ff0000', '#ff0066', '#cc33cc', '#9933cc'],
		['#6633cc', '#3333cc', '#3366ff', '#3399ff'],
		['#33ccff', '#33ffff', '#00ff66', '#00cc00'],
		['#fff', '#ccc', '#999', '#666'],
		['#333', '#000']
	];
}

function whiteLabelApp( localizeData ) {
    if ( APP_CONFIG.alias ) {
        localizeData[ 'app_title' ] =  decodeURIComponent( APP_CONFIG.alias );
        localizeData[ 'app_name' ] =  decodeURIComponent( APP_CONFIG.alias );
    }

    if ( APP_CONFIG.alias_webgis ) {
        localizeData[ 'gurtam_maps' ] =  'WebGis';
    }
}

function clearSelection() {
	if(document.selection && document.selection.empty) {
			document.selection.empty();
	} else if(window.getSelection) {
			var sel = window.getSelection();
			sel.removeAllRanges();
	}
}

function isInt(n) {
	 return typeof n === 'number' && parseFloat(n) === parseInt(n, 10) && !isNaN(n);
}

// LZW-compress a string
function lzw_encode(s) {
		var dict = {};
		var data = (s + "").split("");
		var out = [];
		var currChar;
		var phrase = data[0];
		var code = 256, i;
		for (i=1; i<data.length; i++) {
				currChar=data[i];
				if (dict[phrase + currChar] !== null) {
						phrase += currChar;
				}
				else {
						out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
						dict[phrase + currChar] = code;
						code++;
						phrase=currChar;
				}
		}
		out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
		for (i=0; i < out.length; i++) {
				out[i] = String.fromCharCode(out[i]);
		}
		return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
		var dict = {};
		var data = (s + "").split("");
		var currChar = data[0];
		var oldPhrase = currChar;
		var out = [currChar];
		var code = 256;
		var phrase;
		for (var i=1; i<data.length; i++) {
				var currCode = data[i].charCodeAt(0);
				if (currCode < 256) {
						phrase = data[i];
				}
				else {
					 phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
				}
				out.push(phrase);
				currChar = phrase.charAt(0);
				dict[code] = oldPhrase + currChar;
				code++;
				oldPhrase = phrase;
		}
		return out.join("");
}

/**
 * Format number based on interval "from" - "to"; working from abs values from 0 to 1e27 enough good
 * @author Vitaly Makarevich
 * @param  {number} number       number to format
 * @param  {?int} maxChars
 * @return {string} formatted number
 */
function formatNumber(number, maxChars) {
	// sensolator default maxChars to 4
	maxChars = maxChars ? maxChars : 4;

	var
		// 3 zero suffixes
		suffixes = {
			'0':  '',
			'3':  'K', // Kilo
			'6':  'M', // Mega
			'9':  'G', // Giga
			'12': 'T', // Tera
			'15': 'P', // Peta
			'18': 'E', // Exa
			'21': 'Z', // Zetta
			'24': 'Y', // Yotta
		},
		suffix,
		reg = /([\-+]?[0-9])+\.?([0-9]*)e([\-+]?[0-9]+)/i,
		fract = maxChars > 0 ? maxChars - 1 : null,
		n_exp,
		n_parts,
		i, // integral
		f, // fractional
		e, // exponent
		res;

	if ( !isFinite(number) ) {
		res = number;
	}
	else {
		n_exp = number.toExponential(fract);
		n_parts = reg.exec(n_exp);

		i = n_parts[1];
		f = n_parts[2].replace(/0+$/, '').replace(/\.$/, '');
		e = n_parts[3];

		suffix = Math.floor(e / 3) * 3;

		if (e > 0) {
			if (typeof suffixes[suffix] === 'undefined') {
				return n_exp;
			}
			else {
				// No suffix needed, number from 1 to 999
				if ( !suffixes[suffix] ) {
					if (Math.abs(number) % 1 > 0) {
						res = number.toFixed(maxChars - e + suffix - 1).toString().replace(/0+$/, '').replace(/\.$/, '');
					}
					else {
						res = number;
					}
				}
				// Suffix needed
				else {
					if (suffix === e) {
						res = i + (f ? '.' + f : '') + suffixes[suffix];
					}
					else {
						res = ((Number(i) + Number(f ? Number('0.' + f).toFixed(maxChars - e + suffix + 1) : 0)) * Math.pow(10, e - suffix)).toFixed(maxChars - e + suffix - 1).replace(/0+$/, '').replace(/\.$/, '') + suffixes[suffix];
					}
				}
			}

		}
		else if (e < 0) {
			if (fract && Math.abs(e) > fract) {
				res = n_exp;
			}
			else {
				res = number.toFixed(fract).replace(/0+$/, '').replace(/\.$/, ''); // and remove trailing zeros (0)
			}
		}
		else { // e == 0
			if (Math.abs(number) % 1 > 0) {
				res = number.toFixed(fract).replace(/0+$/, '').replace(/\.$/, ''); // and remove trailing zeros (0)
			}
			else {
				res = number;
			}
		}
	}

	return res;
}

function isTextOverflowActive(element) {
	return (element.offsetWidth < element.scrollWidth);
}

function is_valid_url( url ) {
    return ( /^((http|https):\/\/)?[a-zа-я0-9]+([\-\.]{1}[a-zа-я0-9]+)*\.[a-zа-я]{2,5}(:[0-9]{1,5})?(\/.*)?$/i ).test( url );
}

function is_valid_email(email) {
	return (/^([a-z0-9а-я_\-]+\.)*[a-z0-9а-я_\-]+@([a-z0-9а-я]*[a-z0-9а-я_\-]+\.)+[a-zа-я]{2,4}$/i).test(email);
}

function is_valid_text(text, allowSpecial) {
	if (text === 'null')
		return false;
	var value = '' + text;
	//var regexp = /([\'\"\{\}\\])/gi;
	var regexp = /([\"\{\}\\])/i;
	return (value !== null && typeof value === 'string' && (!value.length || (allowSpecial || !regexp.test(value))));
}

function is_valid_number(number) {
	var value = '' + number;
	return (value !== null && is_valid_text(value) && (/^[\+\-]{0,1}[\d]{1,}[\.]{0,1}[\d]{0,}$/i).test(value));
}

function is_valid_phone(phone) {
	var value = '' + phone;
	return (value !== null && is_valid_text(value) && (/^[+]{1,1}[\d]{7,16}$/i).test(value));
}

function str_pad(str, padding, length) {
	str = String(str);

	if (str.length >= length) {
		return str;
	}

	return new Array(length - str.length + 1).join(padding) + str;
}

function rgbToHex(rgb) {
	return '#' + ((1 << 24) | (rgb.r << 16) | (rgb.g << 8) | rgb.b).toString(16).substr(1);
}

/**
 * Time functions
 */

  /** Get local timezone
   *
   *  @returns {int} local timezone
   */
function get_local_timezone() {
	var rightNow = new Date();
	var jan1 = new Date(rightNow.getFullYear(), 0, 1, 0, 0, 0, 0);  // jan 1st
	var june1 = new Date(rightNow.getFullYear(), 6, 1, 0, 0, 0, 0); // june 1st
	var temp = jan1.toGMTString();
	var jan2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
	temp = june1.toGMTString();
	var june2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
	var std_time_offset = ((jan1 - jan2) / (1000 * 60 * 60));
	var daylight_time_offset = ((june1 - june2) / (1000 * 60 * 60));
	var dst;
	if (std_time_offset === daylight_time_offset) {
		dst = "0"; // daylight savings time is NOT observed
	} else {
		// positive is southern, negative is northern hemisphere
		var hemisphere = std_time_offset - daylight_time_offset;
		if (hemisphere >= 0)
			std_time_offset = daylight_time_offset;
		dst = "1"; // daylight savings time is observed
	}
	return parseInt(std_time_offset*3600,10);
}

function get_user_time(abs_time, tz, dst) {
	if(typeof wialon === "undefined")
		return abs_time;
	var t = abs_time - get_local_timezone() + tz + dst;
		return t;
}

// Get today to send to server
function get_today() {
	var
		serverTime = wialon.core.Session.getInstance().getServerTime(),
		TZ = wialon.util.DateTime.getTimezoneOffset(),
		DST = wialon.util.DateTime.getDSTOffset(serverTime),
		userTime = get_user_time(serverTime, TZ, DST),
		userTimeDate = new Date(userTime * 1000),
		today = {};

	// get today for user in unixtimestamp
	today.from = serverTime - userTimeDate.getHours() * 3600 - userTimeDate.getMinutes() * 60 - userTimeDate.getSeconds();
	today.to = today.from + 86399;

	return today;
}

// Get current user datetime to print
function get_user_now_print_time() {
	var
		serverTime = wialon.core.Session.getInstance().getServerTime(),
		TZ = wialon.util.DateTime.getTimezoneOffset(),
		DST = wialon.util.DateTime.getDSTOffset(serverTime),
		userTime = new Date(get_user_time(serverTime, TZ, DST) * 1000),
		tnow = new Date(userTime);

	userTime.setHours(0);
	userTime.setMinutes(0);
	userTime.setSeconds(0);
	userTime.setMilliseconds(0);

	tnow.setSeconds(tnow.getSeconds() + 86399);

	return {
		from: userTime.getTime() / 1000 | 0,
		to: tnow.getTime() / 1000 | 0
	};
}

/**
 * Get color in linear gradient with several stops according to percent value
 * stops = [
 *   {
 *     color: 0xff00bb,
 *     point: 0
 *   },
 *   ...,
 *   {
 *     color: 0xff0000,
 *     point: 1
 *   },
 * ]
 * 0 <= point <= 1
 */
function gradient_find_color(stops, percentValue) {
	var
		i,
		ratio,
		r, g, b,
		r1,	g1,	b1,
		r2,	g2,	b2,
		stopsLength = stops.length,
		stopFrom,
		stopTo = stopsLength - 1;

	// find needed interval
	for (i = 1; i < stopsLength; i++) {
		if (stops[i].point > percentValue) {
			stopTo = i;
			break;
		}
	}
	stopFrom = stopTo - 1;

	r1 = stops[stopFrom].color >> 16;
	g1 = stops[stopFrom].color >> 8 & 0xFF;
	b1 = stops[stopFrom].color & 0xFF;

	r2 = stops[stopTo].color >> 16;
	g2 = stops[stopTo].color >> 8 & 0xFF;
	b2 = stops[stopTo].color & 0xFF;

	ratio = (percentValue - stops[stopFrom].point) / (stops[stopTo].point - stops[stopFrom].point || 1);

	r = Math.round(r1 + (r2 - r1) * ratio);
	g = Math.round(g1 + (g2 - g1) * ratio);
	b = Math.round(b1 + (b2 - b1) * ratio);

	return {
		r: r,
		g: g,
		b: b
	};
}

function fitSVGText($text, bool, maxWidth) {
	var
		OFFSET = 0.05,
		bb,
		scale,
		isHidden = $text.css('visibility') === 'hidden',
        isThumb = $text.closest('#sensor_skin_defaults').length,
        svg = $text.closest('.indicator-body')[0],
		css = {};

	try {
		bb = $text[0];

		if (isHidden) {
			css.visibility = 'visible';
		}
		// check if we'll need to fit all available size
		if (bool) {
            if ( isThumb ) {
                scale = 5;
            } else {
                if (!svg) {
                    return true;
                }

                bb = bb.getBoundingClientRect();
                var
                    cnt = svg.getBoundingClientRect(),
                    scaleH = cnt.height / bb.height;
    			scale = cnt.width / bb.width;
    			if (scale > scaleH) {
    				scale = scaleH;
    			}
                scale -= OFFSET;
            }
        } else if ( maxWidth ) {
            bb = bb.getBBox();

			if (bb.width > maxWidth * (1 - OFFSET)) {
                scale = maxWidth / bb.width - OFFSET;
			}
		}

		if (scale) {
			css['font-size'] = Math.floor( parseInt($text.css('font-size'), 10) * scale );
		}

		$text.css(css);

        if (bool && svg && qx.bom.client.Browser.getName() === 'ie') {
            var
                vb = svg.getAttribute('viewBox').split(/\s+|,/),
                delta = Math.floor( (~~vb[3] + css['font-size'] / 2) / 2);
            if ( isThumb ) {
                delta += 600;
            }
            $text.attr('y', delta);
        }
	}
	catch(e){}
}

function svgForceRepaint($svg) {
	$svg.attr('width') ? $svg.removeAttr('width') : $svg.attr('width', '100%');
}

// Generate unique UUID
function generateUUID() {
    var
        FORMAT = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
        d = new Date().getTime(),
        uuid = FORMAT.replace( /[xy]/g, function(c) {
            var r = (d + Math.random()*16) % 16 | 0;
            d = Math.floor( d / 16 );
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        } );
    return uuid;
}

// Get scheme
function getTypeScheme(type) {
    var
        EXAMPLE_SCHEME_1 = [ {
            color: '#96c22b',
            value: 25
        }, {
            color: '#f0a116',
            value: 75
        }, {
            color: '#fb0004'
        } ],
        EXAMPLE_SCHEME_2 = [ {
            color: '#f0a116',
            value: 50
        },{
            color: '#fb0004'
        } ],
        EXAMPLE_SCHEME_3 = [ {
            color: '#96c22b',
            value: 36
        }, {
            color: '#f0a116',
            value: 80
        }, {
            color: '#fb0004'
        } ];
    // Define scheme by type
    switch (type) {
        case 'gauge_circle2':
            return [2, _.map(EXAMPLE_SCHEME_3, _.clone)];
        case 'gauge_quartercircle':
            return [0, _.map(EXAMPLE_SCHEME_2, _.clone)];
        default:
            return [1, _.map(EXAMPLE_SCHEME_1, _.clone)];
    }
}

// Update scheme values fn
function convertSchemeValues(scheme, oldRange, newRange) {
    if ( scheme === null ) {
        return false;
    }
    var _isObject = _.isObject( scheme );
    if ( !_isObject ) {
        scheme = (scheme - oldRange[0]) * 100 / (oldRange[1] - oldRange[0]);
    } else {
        // Convert values to percents
        _.forEach(scheme, function(v, i) {
            if (v.value !== null) {
                scheme[i].value = (v.value - oldRange[0]) * 100 / (oldRange[1] - oldRange[0]);
            }
        });
    }
    if (newRange) {
        if ( !_isObject ) {
            scheme.value = (newRange[1] - newRange[0]) * scheme.value / 100 + newRange[0];
        } else {
            // Convert to new values
            _.forEach(scheme, function(v, i) {
                if (v.value !== null) {
                    scheme[i].value = (newRange[1] - newRange[0]) * v.value / 100 + newRange[0];
                }
            });
        }
    }
    return scheme;
}

var
    oldXInit = Rickshaw.Graph.Axis.X.prototype.initialize,
    oldYInit = Rickshaw.Graph.Axis.Y.prototype.initialize;
Rickshaw.Graph.Axis.X.prototype.initialize = function(args) {
    oldXInit.call(this, args);
    this.graphUpdateCallback = function() {
        this.render();
    }.bind(this);
    this.graph.onUpdate(this.graphUpdateCallback);
};
Rickshaw.Graph.Axis.X.prototype.setSize = function(args) {
    args = args || {};
    if (!this.element) {
        return;
    }
	var elementWidth, elementHeight;
    if (typeof window !== 'undefined' && this.element.parentNode) {
        var
            style = window.getComputedStyle(this.element.parentNode, null);
            elementHeight = parseInt(style.getPropertyValue('height'), 10);
        if (!args.auto) {
            elementWidth = parseInt(style.getPropertyValue('width'), 10);
        }
    }
    this.width = (args.width || elementWidth || this.graph.width) * (1 + berthRate);
    this.height = args.height || elementHeight || 40;
    this.vis
        .attr('height', this.height)
        .attr('width', this.width * (1 + berthRate));
    var berth = Math.floor(this.width * berthRate / 2);
    this.element.style.left = -1 * berth + 'px';
};
Rickshaw.Graph.Axis.X.prototype.destroy = function() {
    // Remove Axis
    d3.select(this.element).remove();
    // Remove Grid
    this.graph.vis.select('.x_axis_d3').remove();
    // Remove Update Callback
    for (var i = this.graph.updateCallbacks.length - 1; i > -1; i--) {
        if (this.graph.updateCallbacks[i] === this.graphUpdateCallback) {
            this.graph.updateCallbacks.splice(i, 1);
            break;
        }
    }
};
Rickshaw.Graph.Axis.Y.prototype.initialize = function(args) {
    oldYInit.call(this, args);
    this.graphUpdateCallback = function() {
        this.render();
    }.bind(this);
    this.graph.onUpdate(this.graphUpdateCallback);
};
Rickshaw.Graph.Axis.Y.prototype.setSize = function(args) {
    args = args || {};
    if (!this.element) {
        return;
    }
	var elementWidth, elementHeight;
    if (typeof window !== 'undefined' && this.element.parentNode) {
        var
            style = window.getComputedStyle(this.element.parentNode, null);
            elementWidth = parseInt(style.getPropertyValue('width'), 10);
        if (!args.auto) {
            elementHeight = parseInt(style.getPropertyValue('height'), 10);
        }
    }
    this.width = args.width || elementWidth || this.graph.width * this.berthRate;
    this.height = args.height || elementHeight || this.graph.height;
    this.vis
        .attr('width', this.width)
        .attr('height', this.height * (1 + this.berthRate));
    var berth = this.height * this.berthRate;
    if (this.orientation === 'left') {
        this.element.style.top = -1 * berth + 'px';
    }
};
Rickshaw.Graph.Axis.Y.prototype.destroy = function() {
    // Remove Axis
    d3.select(this.element).remove();
    // Remove Grid
    this.graph.vis.select('.y_grid').remove();
    // Remove Update Callback
    for (var i = this.graph.updateCallbacks.length - 1; i > -1; i--) {
        if (this.graph.updateCallbacks[i] === this.graphUpdateCallback) {
            this.graph.updateCallbacks.splice(i, 1);
            break;
        }
    }
};

'use strict';

/**
 * Sensolator specific bindings
 * required: jQuery and underscoreJS via $ and _
 */

/**
 * valueFloat binding
 */
ko.bindingHandlers.valueFloat = {
	init: (function(){
		var
			successClass = 'has-success',
			errorClass = 'has-error';

		var handleBinding = function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var
				$element = $(element),
				$parent = $element.parent(),
				params = valueAccessor(),
				initValue = ko.unwrap(params.data);

			$element
				.val( initValue )
				.on('keyup change', function(event){
					var
						val = parseFloat( $element.val().replace(',', '.') );

					if ( isFinite(val) ) {
						if (initValue === false) {
							initValue = val;
						}
						params.data(val);

						if (typeof params.change === 'function') {
							params.change($element.attr('name'));
						}
						if ( $parent.hasClass(errorClass) ) {
							$parent.removeClass(errorClass);
						}
						/* jshint eqeqeq:false */
						if (val != initValue) {
							$parent.addClass(successClass);
						}
						else {
							$parent.removeClass(successClass);
						}
					}
					else {
						if ( !$parent.hasClass(errorClass) ) {
							$parent.addClass(errorClass);
							if ($parent.hasClass(successClass)) {
								$parent.removeClass(successClass);
							}
						}
					}

					return true;
				});
		};

		return handleBinding;
	}()),
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		var
			$element = $(element),
			params = valueAccessor(),
			modelValue = ko.unwrap(params.data);
		/* jshint eqeqeq:false */
		if ($element.val() != modelValue) {
			$element.val(modelValue).change();
		}
	}
};

/**
 * valueString binding
 */
ko.bindingHandlers.valueString = {
	init: (function(){
		var handleBinding = function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var
				$element = $(element),
				// $parent = $element.parent(),
				params = valueAccessor(),
				initValue = ko.unwrap(params.data);

			$element
				.val( initValue )
				.on('keyup change', function(event){
					var
						val = $element.val();

					if (initValue === false) {
						initValue = val;
					}
					params.data(val);

					if (typeof params.change === 'function') {
						params.change();
					}

					return true;
				});
		};

		return handleBinding;
	}()),
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		var
			$element = $(element),
			params = valueAccessor(),
			modelValue = ko.unwrap(params.data);
		/* jshint eqeqeq:false */
		if ($element.val() != modelValue) {
			$element.val(modelValue).keyup();
		}
	}
};

/**
 * validate binding
 */
ko.bindingHandlers.validate = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		var
			bindings,
			$element,
			params = valueAccessor(),
			validator = $.isFunction(params.validator) && params.validator || false,
			validClass = params.validClass || 'valid',
			onValid = $.isFunction(params.onValid) && params.onValid || false,
			onInvalid = $.isFunction(params.onInvalid) && params.onInvalid || false,
			invalidClass = params.invalidClass || 'invalid',
			validState = ko.isObservable(params.validState) && params.validState || false,
			validatorHandler;

		if ( !validator ) {
			return;
		}

		bindings = allBindings();
		$element = $(element);

		validatorHandler = _.throttle(
			function(event){
				var
					val = $element.val();

				if ( validator(val) ) {
					$element
						.removeClass(invalidClass)
						.addClass(validClass);

					onValid && onValid();
					validState && validState(true);
				}
				else {
					$element
						.removeClass(validClass)
						.addClass(invalidClass);

					onInvalid && onInvalid();
					validState && validState(false);
				}

				return true;
			},
			100,
			{leading: true}
		);

		bindings.value && bindings.value.subscribe(validatorHandler);

		$element.on('keyup change', validatorHandler);

		validatorHandler();
	}
};

/**
 * hasFocus binding with selection
 */
ko.bindingHandlers.hasSelectedFocus = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		ko.bindingHandlers['hasfocus'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
	},
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		ko.bindingHandlers['hasfocus'].update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);

		var selected = ko.utils.unwrapObservable(valueAccessor());
		if (selected) {
			element.select();
		}
	}
};

// Sensolator utils module
var sensolator = (function(app){
	'use strict';

	app.utils = app.utils || {};

	// ***************************
	// Public Properties & Methods
	// ***************************

	/**
	 * Extend object containing knockout.js fields, recursive
	 * @param {object} target An object that will receive the new properties or receive updated values
	 * @param {...object} var_args An objects containing additional properties to merge/update in target
	 * @return {object} target object
	 */
	app.utils.extendKo = function extendKo(target) {
		var
			s,
			i,
			val,
			srcObjs = Array.prototype.slice.call(arguments, 1);

		if (typeof target !== 'object') {
			target = {};
		}

		for (s in srcObjs) {
			if (typeof srcObjs !== 'object' || !srcObjs.hasOwnProperty(s)) continue;

			for (i in srcObjs[s]) {
				switch ( typeof srcObjs[s][i] ) {
					case 'object':
                        var
                            _isArray = _.isArray( srcObjs[s][i] ),
                            _srcObject = _isArray ? _.map(srcObjs[s][i], _.clone) : srcObjs[s][i];
                        if ( ko.isObservable(target[i]) ) {
                            target[i]( _isArray ? _srcObject : $.extend(true, {}, _srcObject) );
                        }
                        else if (_isArray) {
                            target[i] = _.map(_srcObject, _.clone);
                        }
                        else {
                            if (typeof target[i] !== 'object') {
                                target[i] = {};
                            }
                            app.utils.extendKo(target[i], _srcObject);
                        }
                        break;
					case 'function':
						if ( ko.isObservable( srcObjs[s][i] ) ) {
							val = srcObjs[s][i]();
							if (typeof val === 'object') {
								if ( ko.isObservable(target[i]) ) {
									target[i]( app.utils.extendKo(target[i](), val) );
								}
								else if (typeof target[i] !== 'object') {
									target[i] = app.utils.extendKo({}, val);
								}
                                else {
                                    target[i] = _.map(val, _.clone);
                                }
							}
							else {
								if (typeof target[i] === 'function') {
									target[i]( val );
								}
								else {
									target[i] = val;
								}
							}
						}
						break;
					default:
						if ( ko.isObservable( target[i] ) ) {
							target[i]( srcObjs[s][i] );
						}
						else {
							target[i] = srcObjs[s][i];
						}
						break;
				}
			}
		}

		return target;
	};

	app.utils.resizeRickshawGraph = function resizeRickshawGraph(graph) {
		var
			$e = app.$(graph.element),
			$rgraph = $e.closest('.rgraph'),
			$graph_container = $rgraph.find('.graph-container');

		// console.log( $rgraph.width() - parseInt( $rgraph.find('.graph-container').css('margin-left'), 10 ) );

		graph.configure({
			width: $rgraph.width() - parseInt($graph_container.css('padding-left'), 10) - parseInt($graph_container.css('padding-right'), 10),
			height: $rgraph.height() - parseInt($graph_container.css('padding-top'), 10) - parseInt($graph_container.css('padding-bottom'), 10)
		});

		graph.render();

		return true;
	};

	/**
	 * Strip 'http://' or '//' prefix from the url string
	 * @param  {string} url URL string
	 * @return {string}     string without 'http://' or '//'
	 */
	app.utils.stripHTTP = function stripHTTP(url) {
		if (url) {
			return url.replace(/^(http:)?\/\//i, '');
		}
		else {
			return '';
		}
	};

	/**
	 * Prepend 'http://' to the URL string, supported protocols are http, https, ftp
	 * @param  {string} url String supposed to be a valid URL
	 * @return {string}     Valid URL string
	 */
	app.utils.prependHTTP = function prependHTTP(url) {
		var
			res = url,
			regProtocol = /^(http|https|ftp|\/\/)/i;

		if ( !regProtocol.test(res) ) {
			res = 'http://' + res;
		}

		return res;
	};

	return app;
})(sensolator || {});

/**
 * Sensolator Core Module
 * @author Vitaly Makarevich
 * @copyright 2002-2014 Gurtam
 * @license http://www.gnu.org/licenses/lgpl.html LGPL
 */
var sensolator = (function(app){
	'use strict';

	app.core = app.core || {};

	app.lang = app.lang || {};

	// ****************************
	// Private Properties & Methods
	// ****************************
	var branch = $.url().param('b') || 'master';
	var
		/**
		 * wialon.js URL trailing part
		 * @private
		 * @const
		 * @type {string}
		 */
		WIALON_JS_ = '/wsdk/script/wialon.js',

		/**
		 * Base URL for loading Wialon
		 * @private
		 * @type {string}
		 */
		baseURL_ = $.url().param('vima') ? 'http://diha.dev.gurtam.net:8012' : ($.url().param('baseUrl') || $.url().param('hostUrl') || (branch=='develop'?'https://dev-api.wialon.com':'https://hst-api.wialon.com')),

		/**
		 * Wialon user name
		 * @private
		 * @type {string}
		 */
		user_ = $.url().param('vima') ? 'wialon' : $.url().param('user') || '',


		/**
		 * Wialon auth hash
		 * @private
		 * @type {string}
		 */
		authHash_ = $.url().param('authHash') || $.url().param('auth_hash') || $.url().param('access_hash'),

		/**
		 * Wialon user debug password
		 * @private
		 * @type {string}
		 */
		password_ = $.url().param('vima') ? '' : ($.url().param('password') || ''),

		/**
		 * Wialon session id
		 * @private
		 * @type {string}
		 */
		sid_ = $.url().param('sid') || '',

		// Save/Restore app state serialization settings object
		serialize_ = {
			// changed to true when page loads in core.appStateRestore, we don't serialize app state before we get previous state
			allow: false,
			// list of modules which need to be serialized/unserialized
			modules: [
				'user',
				'desktops'
			],
			// throttle time for appStateSave in milliseconds
			throttleTime: 1000,
			storage: {
				__detectEngine: function __detectEngine(callback) {
					var
						self = this;

					if (self.__engine) {
						app.core.callCallback(callback, [this.__engine]);
					}
					else {
						// 1) Test new fileServer
						self.__engines.fileServer.test(function(errorCode) {
							if (errorCode) {
								// 2) Test old fileServer; TODO: remove it after old fileServer API removed
								self.__engines.fileServerOld.test(function(errorCode) {
									if (errorCode) {
										self.__engine = 'customProp';
									}
									else {
										self.__engine = 'fileServerOld';
									}
									app.core.callCallback(callback, [self.__engine]);
								});
							}
							else {
								self.__engine = 'fileServer';
								app.core.callCallback(callback, [self.__engine]);
							}
						});
					}
					return self.__engine;
				},
				__engine: '', // one of the __engines
				__engines: {
					customProp: {
						// custom property name to store data to, OLD way used only to read data, then this prop destroyed
						__propName: '__sensolatorAppState',
						read: function read(callback) {
							var
								customProp = app._.unescape(app.user.currentUser.getCustomProperty(this.__propName));

							app.core.callCallback(callback, [customProp]);
						},
						write: function write(data, callback) {
							app.user.currentUser.updateCustomProperty(this.__propName, data, callback);
						},
						del: function del(callback) {
							app.user.currentUser.updateCustomProperty(this.__propName, '', callback);
						}
					},
					fileServerOld: { // Legacy support, TODO: remove it after old API removed
						__readData: null,
						__flags: 0, // flags used to read/write/delete files: 0 - protected, 1 - public
						__path: {
							test: '/wialon/apps/sensolator/test.tmp',
							appState: '/wialon/apps/sensolator/appState.json'
						},
						test: function test(callback) {
							var
								self = this,
								testData = (new Date()).getTime().toString();

							if (app.wialon.util.File.readFile && app.wialon.util.File.writeFile && app.wialon.util.File.rm) {
								serialize_.storage.__engines.customProp.read(function customPropReadCallback(customPropJSON) {
									if (customPropJSON) {
										// we found appState in customProp
										app.wialon.util.File.writeFile(
											app.user.currentUser.getId(),
											self.__path.appState,
											self.__flags,
											customPropJSON,
											function writeFileCallback(errorCode) {
												if (errorCode) {
													// when write to fileServer an error occured
													app.core.callCallback(callback, [errorCode]);
												}
												else {
													// write to fileServer Ok, then we delete customProp
													serialize_.storage.__engines.customProp.del(function deleteCustomPropCallback() {
														// and return 0 as no error occured
														app.core.callCallback(callback, [0]);
													});
												}
											}
										);
									}
									else {
										// we didn't find appState in customProp, try to read appState first
										app.wialon.util.File.readFile(
											app.user.currentUser.getId(),
											self.__path.appState,
											self.__flags,
											function readFileCallback(errorCode, data) {
												if (!errorCode) {
													self.__readData = data;
													app.core.callCallback(callback, [0]);
												}
												else {
													// no data found, try to write test data & check it
													app.wialon.util.File.writeFile(
														app.user.currentUser.getId(),
														self.__path.test,
														self.__flags,
														testData,
														function writeFileCallback(errorCode) {
															if (errorCode) {
																app.core.callCallback(callback, [errorCode]);
															}
															else {
																// test read
																app.wialon.util.File.readFile(
																	app.user.currentUser.getId(),
																	self.__path.test,
																	self.__flags,
																	function readFileCallback(errorCode, data) {
																		if (errorCode || !data || !data.fileData || data.fileData !== testData) {
																			app.core.callCallback(callback, [errorCode]);
																		}
																		else {
																			// test remove
																			app.wialon.util.File.rm(
																				app.user.currentUser.getId(),
																				self.__path.test,
																				self.__flags,
																				function rmCallback(errorCode) {
																					if (errorCode) {
																						app.core.callCallback(callback, [errorCode]);
																					}
																					else {
																						// create samle data
																						self.write('false', function testWriteCallback() {
																							// now write && read && remove tested and Ok
																							app.core.callCallback(callback, [0]);
																						});
																					}
																				}
																			);
																		}
																	}
																);
															}
														}
													);
												}
											}
										);
									}
								});
							}
							else {
								app.core.callCallback(callback, [-1]);
							}
						},
						read: function read(callback) {
							var
								self = this;

							if (self.__readData && self.__readData.fileData) {
								// if data catched on test then don't query it again
								app.core.callCallback(callback, [self.__readData.fileData]);
								self.__readData = null;
							}
							else {
								app.wialon.util.File.readFile(
									app.user.currentUser.getId(),
									self.__path.appState,
									self.__flags,
									function readFileCallback(errorCode, data){
										if (errorCode) {
											// if error occured back to customProp engine
											serialize_.storage.__engine = 'customProp';
											serialize_.storage.doAction('read', callback);
										}
										else {
											app.core.callCallback(callback, [data.fileData]);
										}
									}
								);
							}
						},
						write: function write(data, callback) {
							var
								self = this;

							app.wialon.util.File.writeFile(
								app.user.currentUser.getId(),
								self.__path.appState,
								self.__flags,
								data,
								function writeFileCallback(errorCode) {
									if (errorCode) {
										// if error occured back to customProp engine
										serialize_.storage.__engine = 'customProp';
										serialize_.storage.doAction('write', data, callback);
									}
									else {
										app.core.callCallback(callback);
									}
								}
							);
						},
						del: function del(callback) {
							var
								self = this;

							app.wialon.util.File.rm(
								app.user.currentUser.getId(),
								self.__path.appState,
								self.__flags,
								callback
							);
						}
					},
					fileServer: {
						__readData: null,
						__storageType: null, // flags used to read/write/delete files: 1 - public, 2 - protected
						__writeType: 0, // 0 - rewrite, 1 - append, 2 - don't write if exists
						__path: {
							test: '/wialon/apps/sensolator/test.tmp',
							appState: '/wialon/apps/sensolator/appState.json'
						},
						test: function test(callback) {
							var
								self = this,
								testData = (new Date()).getTime().toString();

							if (app.wialon.item.Item.fileStorageType && app.user.currentUser.fileGet && app.user.currentUser.fileWrite && app.user.currentUser.fileRm) {
								// set storageType
								self.__storageType = app.wialon.item.Item.fileStorageType.protectedType;
								serialize_.storage.__engines.customProp.read(function customPropReadCallback(customPropJSON) {
									if (customPropJSON) {
										// we found appState in customProp
										// fileWrite: function(storageType, path, content, writeType, contentType, callback)
										app.user.currentUser.fileWrite(
											self.__storageType, // storageType
											self.__path.appState, // path
											customPropJSON, // content
											self.__writeType, // writeType
											0, // contentType (0 = plainText)
											function writeFileCallback(errorCode) { // callback
												if (errorCode) {
													// when write to fileServer an error occured
													app.core.callCallback(callback, [errorCode]);
												}
												else {
													// write to fileServer Ok, then we delete customProp
													serialize_.storage.__engines.customProp.del(function deleteCustomPropCallback() {
														// and return 0 as no error occured
														app.core.callCallback(callback, [0]);
													});
												}
											}
										);
									}
									else {
										// we didn't find appState in customProp, try to read appState first
										// fileRead: function(storageType, path, contentType, callback)
										app.user.currentUser.fileRead(
											self.__storageType, // storageType
											self.__path.appState, // path
											0, // contentType (0 = plainText)
											function readFileCallback(errorCode, data) { // callback
												if (!errorCode) {
													self.__readData = data;
													app.core.callCallback(callback, [0]);
												}
												else {
													// no data found, try to write test data & check it
													// fileWrite: function(storageType, path, content, writeType, contentType, callback)
													app.user.currentUser.fileWrite(
														self.__storageType, // storageType
														self.__path.test, // path
														testData, // content
														self.__writeType, // writeType
														0, // contentType (0 = plainText)
														function writeFileCallback(errorCode) { // callback
															if (errorCode) {
																app.core.callCallback(callback, [errorCode]);
															}
															else {
																// test read
																app.user.currentUser.fileRead(
																	self.__storageType, // storageType
																	self.__path.test, // path
																	0, // contentType (0 = plainText)
																	function readFileCallback(errorCode, data) { // callback
																		if (errorCode || !data || !data.content || data.content !== testData) {
																			app.core.callCallback(callback, [errorCode]);
																		}
																		else {
																			// test remove
																			// fileRm: function(storageType, path, callback)
																			app.user.currentUser.fileRm(
																				self.__storageType, // storageType
																				self.__path.test, // path
																				function rmCallback(errorCode) { // callback
																					if (errorCode) {
																						app.core.callCallback(callback, [errorCode]);
																					}
																					else {
																						// create samle data
																						self.write('false', function testWriteCallback() {
																							// now write && read && remove tested and Ok
																							app.core.callCallback(callback, [0]);
																						});
																					}
																				}
																			);
																		}
																	}
																);
															}
														}
													);
												}
											}
										);
									}
								});
							}
							else {
								app.core.callCallback(callback, [-1]);
							}
						},
						read: function read(callback) {
							var
								self = this;

							if (self.__readData && self.__readData.content) {
								// if data catched on test then don't query it again
								app.core.callCallback(callback, [self.__readData.content]);
								self.__readData = null;
							}
							else {
								// fileRead: function(storageType, path, contentType, callback)
								app.user.currentUser.fileRead(
									self.__storageType, // storageType
									self.__path.appState, // path
									0, // contentType (0 = plainText)
									function readFileCallback(errorCode, data){ // callback
										if (errorCode) {
											// if error occured back to customProp engine
											serialize_.storage.__engine = 'customProp';
											serialize_.storage.doAction('read', callback);
										}
										else {
											app.core.callCallback(callback, [data.content]);
										}
									}
								);
							}
						},
						write: function write(data, callback) {
							var
								self = this;

							// fileWrite: function(storageType, path, content, writeType, contentType, callback)
							app.user.currentUser.fileWrite(
								self.__storageType, // storageType
								self.__path.appState, // path
								data, // content
								self.__writeType, // writeType
								0, // contentType (0 = plainText)
								function writeFileCallback(errorCode) { // callback
									if (errorCode) {
										// if error occured back to customProp engine
										serialize_.storage.__engine = 'customProp';
										serialize_.storage.doAction('write', data, callback);
									}
									else {
										app.core.callCallback(callback);
									}
								}
							);
						},
						del: function del(callback) {
							var
								self = this;

							// fileRm: function(storageType, path, callback)
							app.user.currentUser.fileRm(
								self.__storageType, // storageType
								self.__path.appState, // path
								callback
							);
						}
					}
				},
				/**
				 * Proxy action to __engine, see __engines spec for calling options
				 * @param  {string} actionType one of the 'read', 'write', 'del'
				 */
				doAction: function doAction(actionType) {
					var
						args = Array.prototype.slice.call(arguments, 1);

					if (serialize_.storage.__engine) {
						serialize_.storage.__engines[serialize_.storage.__engine][actionType].apply(serialize_.storage.__engines[serialize_.storage.__engine], args);
					}
					else {
						serialize_.storage.__detectEngine(function __detectEngineCallback() {
							serialize_.storage.__engines[serialize_.storage.__engine][actionType].apply(serialize_.storage.__engines[serialize_.storage.__engine], args);
						});
					}
				}
			},
			shortKeys: {
				'modules': 'M',
					'modules.desktops': 'D', // M.D -> desktops
						'modules.desktops.currentId': 'C',
						'modules.desktops.lastId_': 'L',
						'modules.desktops.length_': 'l',
						'modules.desktops.listById': 'Li',
							'modules.desktops.listById.*': '*',
								'modules.desktops.listById.*.background': 'B',
									'modules.desktops.listById.*.background.type': 'T',
									'modules.desktops.listById.*.background.value': 'V',
										'modules.desktops.listById.*.background.value.lat': 'L',
										'modules.desktops.listById.*.background.value.lng': 'l',
										'modules.desktops.listById.*.background.value.tileType': 'T',
										'modules.desktops.listById.*.background.value.zoom': 'Z',
								'modules.desktops.listById.*.backgroundInactive': 'b',
									'modules.desktops.listById.*.backgroundInactive.color': 'C',
										'modules.desktops.listById.*.backgroundInactive.color.value': 'V',
									'modules.desktops.listById.*.backgroundInactive.image': 'I',
										'modules.desktops.listById.*.backgroundInactive.image.value': 'V',
									'modules.desktops.listById.*.backgroundInactive.map': 'M',
										'modules.desktops.listById.*.backgroundInactive.map.value': 'V',
											'modules.desktops.listById.*.backgroundInactive.map.value.lat': 'L',
											'modules.desktops.listById.*.backgroundInactive.map.value.lng': 'l',
											'modules.desktops.listById.*.backgroundInactive.map.value.tileType': 'T',
											'modules.desktops.listById.*.backgroundInactive.map.value.zoom': 'Z',
								'modules.desktops.listById.*.id': 'I',
								'modules.desktops.listById.*.printName': 'P',
								'modules.desktops.listById.*.remoteURLCollection': 'R',
									'modules.desktops.listById.*.remoteURLCollection.lastId': 'L',
									'modules.desktops.listById.*.remoteURLCollection.length': 'l',
									'modules.desktops.listById.*.remoteURLCollection.listById': 'Li',
										'modules.desktops.listById.*.remoteURLCollection.listById.*': '*',
											'modules.desktops.listById.*.remoteURLCollection.listById.*.id': 'I',
											'modules.desktops.listById.*.remoteURLCollection.listById.*.props': 'P',
												'modules.desktops.listById.*.remoteURLCollection.listById.*.props.col': 'C',
												'modules.desktops.listById.*.remoteURLCollection.listById.*.props.controls': 'c',
												'modules.desktops.listById.*.remoteURLCollection.listById.*.props.row': 'R',
												'modules.desktops.listById.*.remoteURLCollection.listById.*.props.sizex': 'S',
												'modules.desktops.listById.*.remoteURLCollection.listById.*.props.sizey': 's',
											'modules.desktops.listById.*.remoteURLCollection.listById.*.url': 'U',
								'modules.desktops.listById.*.watchSensors': 'W',
									'modules.desktops.listById.*.watchSensors.*': '*',
										'modules.desktops.listById.*.watchSensors.*.*': '*',
											'modules.desktops.listById.*.watchSensors.*.*.gridster': 'G',
												'modules.desktops.listById.*.watchSensors.*.*.gridster.controls': 'C',
												'modules.desktops.listById.*.watchSensors.*.*.gridster.sizex': 'S',
												'modules.desktops.listById.*.watchSensors.*.*.gridster.sizey': 's',
											'modules.desktops.listById.*.watchSensors.*.*.indicator': 'I',
												'modules.desktops.listById.*.watchSensors.*.*.indicator.max': 'M',
												'modules.desktops.listById.*.watchSensors.*.*.indicator.min': 'm',
												'modules.desktops.listById.*.watchSensors.*.*.indicator.round': 'R',
												'modules.desktops.listById.*.watchSensors.*.*.indicator.show_unit_name': 'S',
												'modules.desktops.listById.*.watchSensors.*.*.indicator.show_axes': 'X',
												'modules.desktops.listById.*.watchSensors.*.*.indicator.skin': 's',
											'modules.desktops.listById.*.watchSensors.*.*.onDesktop': 'O',
											'modules.desktops.listById.*.watchSensors.*.*.period': 'P',
								'modules.desktops.listById.*.watchCounters': 'C',
									'modules.desktops.listById.*.watchCounters.*': '*',
										'modules.desktops.listById.*.watchCounters.*.*': '*',
											'modules.desktops.listById.*.watchCounters.*.*.gridster': 'G',
												'modules.desktops.listById.*.watchCounters.*.*.gridster.controls': 'C',
												'modules.desktops.listById.*.watchCounters.*.*.gridster.sizex': 'S',
												'modules.desktops.listById.*.watchCounters.*.*.gridster.sizey': 's',
											'modules.desktops.listById.*.watchCounters.*.*.indicator': 'I',
												'modules.desktops.listById.*.watchCounters.*.*.indicator.max': 'M',
												'modules.desktops.listById.*.watchCounters.*.*.indicator.min': 'm',
												'modules.desktops.listById.*.watchCounters.*.*.indicator.round': 'R',
												'modules.desktops.listById.*.watchCounters.*.*.indicator.show_unit_name': 'S',
												'modules.desktops.listById.*.watchCounters.*.*.indicator.show_axes': 'X',
												'modules.desktops.listById.*.watchCounters.*.*.indicator.skin': 's',
											'modules.desktops.listById.*.watchCounters.*.*.onDesktop': 'O',
											'modules.desktops.listById.*.watchCounters.*.*.period': 'P',
					'modules.user': 'U',
						'modules.user.notifications': 'N',
							'modules.user.notifications.email': 'E',
							'modules.user.notifications.phone': 'P',
						'modules.user.version': 'UV'
			},
			convertKeys: (function(){
				var
					keys_,
					shortKeys_,
					fullKeys_;

				var getFullKeys_ = function() {
					var
						i,
						j,
						l,
						arr = [],
						namespaces,
						key,
						namespacesLength,
						res = {};

					// get sorted array of shortKeys, used because modules.desktops cant esablished before modules established
					for (i in shortKeys_) {
						arr.push({
							'full': i,
							'short': shortKeys_[i]
						});
					}
					arr.sort(function(a, b){
						return a.full === b.full ? 0 : (a.full > b.full ? 1 : -1);
					});

					for (i = 0, l = arr.length; i < l; i++) {
						namespaces = arr[i].full.split('.');
						namespacesLength = namespaces.length;
						if (namespacesLength > 1) {
							key = '';
							--namespacesLength;
							for (j = 0; j < namespacesLength; j++) {
								key += shortKeys_[ namespaces.slice(0, j + 1).join('.') ] + '.';
							}
							key += shortKeys_[ namespaces.slice(0, j + 1).join('.') ];

							res[key] = namespaces[j];
						}
						else {
							res[ arr[i].short ] = arr[i].full;
						}
					}

					return res;
				};

				var swapKeys_ = function(srcObj, namespace) {
					var
						res = {},
						shortKey,
						prefix = namespace ? namespace + '.' : '',
						i;

					for (i in srcObj) {
						shortKey = keys_[ prefix + i ];
						if (shortKey) {
							if ( typeof srcObj[i] === 'object' ) {
								res[ shortKey ] = swapKeys_( srcObj[i], prefix + i );
							}
							else {
								res[ shortKey ] = srcObj[i];
							}
						}
						else {
							if ( typeof srcObj[i] === 'object' ) {
								res[i] = swapKeys_( srcObj[i], prefix + '*');
							}
							else {
								res[i] = srcObj[i];
							}
						}
					}

					return res;
				};

				var convertKeys = function(srcObj, keysType) {
					!shortKeys_ && (shortKeys_ = serialize_.shortKeys);
					!fullKeys_ && (fullKeys_ = getFullKeys_());

					if (keysType === 'full') {
						keys_ = fullKeys_;
					}
					else {
						keys_ = shortKeys_;
					}

					return swapKeys_(srcObj);
				};

				return convertKeys;
			}())
		},

		pendingCachingElements_ = {
			header: '#header:first',
			page_container: 'div#page_container:first',
			grid_cont: 'div#grid_cont:first',
			sensor_info_graph_preview: 'div#preview:first',
			close_confirm_modal: 'div#close-confirm-modal:first'
		};

	/**
	 * Fired when sensolator.startApp fired
	 */
	var initDOM_ = function initDOM_() {
		var
			e;

		for (e in pendingCachingElements_) {
			app.core.$c[e] = app.$( pendingCachingElements_[e] );
		}

		// Bootstrap multiple modals z-index fix
		(function(){
			var
				FORCE_SHOW_MODAL_ = 'close-confirm-modal',
				START_Z_INDEX = 1040,
				visible_modal_ids_ = {},
				visible_modal_count_ = 0,
				bootstrap_modal_current_zindex_ = START_Z_INDEX;

			app.$( app.doc ).on({
				'show.bs.modal': function(event){
					var
						$modal = app.$(event.currentTarget),
						modal_id = $modal.attr('id');

					if ( !visible_modal_ids_[modal_id] ) {
						++visible_modal_count_;
						visible_modal_ids_[modal_id] = app.units.sensorsPanelUnit();
					}

					++bootstrap_modal_current_zindex_;
					$modal.css('z-index', bootstrap_modal_current_zindex_);

					return true;
				},
				'shown.bs.modal': function(event){
					var
						$current_modal = app.$(event.currentTarget),
						$hide_modal;

					if ( $current_modal.not('#' + FORCE_SHOW_MODAL_).length ) {
						$hide_modal = app.$('div.modal.in').not( $current_modal );
						$hide_modal.modal('hide');
					}

					// Fix z-index for backdrop layer
					app.$('body:first').find('div.modal-backdrop:last-child')
						.css('z-index', bootstrap_modal_current_zindex_ - 1)
						.click(_.throttle(
							function(event){
								var
									OPACITY_DELTA = 0.2,
									ANIMATE_DURATION = 200,
									$activeModal,
									z,
									zMax = -1,
									$this = app.$(this),
									startOpacity = Number( $this.css('opacity') ),
									endOpacity = startOpacity + OPACITY_DELTA;

								endOpacity > 1 && (endOpacity = 1);

								$this.animate(
									{
										opacity: endOpacity
									},
									ANIMATE_DURATION / 2,
									function() {
										$this.animate(
											{
												opacity: startOpacity
											},
											ANIMATE_DURATION / 2
										);
									}
								);

								// Find visible modal and focus to it to enable Esc key to close it
								app.core.$c.page_container.children('div.modal.in').each(function(i, item){
									z = Number( app.$(item).css('z-index') );
									if (z >= zMax) {
										zMax = z;
										$activeModal = app.$(item);
									}
								});
								$activeModal.focus();
							},
							400)
						);
				},
				'hidden.bs.modal': function(event){
					var
						i,
						$m,
						$modal = app.$(event.currentTarget),
						modal_id = $modal.attr('id');

					delete visible_modal_ids_[modal_id];
					--visible_modal_count_;

					if ( !visible_modal_count_ ) {
						bootstrap_modal_current_zindex_ = START_Z_INDEX;
					}
					else {
						if ( app.$('#' + modal_id).css('z-index') === bootstrap_modal_current_zindex_ ) {
							--bootstrap_modal_current_zindex_;
						}

						// Focus to next visible modal (to enable Esc key close that window)
						for (i in visible_modal_ids_) {
							$m = app.$('#' + i);
							if ( $m.css('z-index') === bootstrap_modal_current_zindex_  ) {
								$m.focus();
							}
						}

						if ( visible_modal_ids_['unit_sensors'] ) {
							app.units.unitWindowShow( visible_modal_ids_['unit_sensors'] );
						}
					}

					return true;
				}
			}, '.modal');
		}());

		// Update gridster graphs on window.resize
		window.addEventListener(
			'resize',
			_.throttle(
				function(event){
					var
						preview,
						$e;

					if (app.units.sensorInfoGraph) {
						$e = app.$(app.units.sensorInfoGraph.element);
						app.units.sensorInfoGraph.configure({
							width: $e.width(),
							height: $e.height()
						});
						app.units.sensorInfoGraph.render();

						// Destroy & create preview
						preview = document.getElementById('preview');
						app.$(preview).empty();

						preview = new Rickshaw.Graph.RangeSlider.Preview({
							graph: app.units.sensorInfoGraph,
							element: preview
						});
					}

					app.desktops.fixDesktopsListWidth();

					// Find all graphs and redraw them
					app.$('div.rgraph:visible').each(function(){
						app.utils.resizeRickshawGraph( $.data(this, 'graph') );
					});
				},
				30,
				{leading: false}
			)
		);

		!(function() {
			var tog = function tog(v){
				return v ? 'addClass' : 'removeClass';
			};
			app.$(document).on('input', '.clearable', function(){
				app.$(this)[tog(this.value)]('x');
			}).on('mousemove', '.x', function( e ){
				app.$(this)[tog(this.offsetWidth-18 < e.clientX-this.getBoundingClientRect().left)]('onX');
			}).on('click', '.onX', function(){
				app.$(this).removeClass('x onX').val('').trigger('input').trigger('change');
			});

		}());

		app.user.initDOM();
		app.desktops.initDOM();
		app.units.initDOM();
		app.notifications.initDOM();
	};

	/**
	 * Wialon session load
	 * @private
	 * @return {[type]}
	 */
	var wialonLoadSession_ = function wialonLoadSession_() {
		var
			operateAs = user_, // operate as current user
			continueCurrentSession = true, // continue current session
			sessionInitFlags = 0x800, // using internalGis
			appDNS = 'gapp_sensolator';

		var loginCallback = function(code) {
			var
				spec,
				dataFlags = [
					app.wialon.item.Item.dataFlag.base,
					app.wialon.item.Item.dataFlag.image,
					app.wialon.item.Item.dataFlag.adminFields,
					app.wialon.item.Item.dataFlag.customFields,
					app.wialon.item.Item.dataFlag.customProps,
					app.wialon.item.Unit.dataFlag.commands,
					app.wialon.item.Unit.dataFlag.commandAliases,
					app.wialon.item.Unit.dataFlag.counters,
					app.wialon.item.Unit.dataFlag.lastMessage,
					app.wialon.item.Unit.dataFlag.messageParams,
					app.wialon.item.Unit.dataFlag.sensors,
					app.wialon.item.Unit.dataFlag.restricted // for item uniqueId
				],
				s = app.wialon.core.Session.getInstance();

			if (code) {
				app.core.errorMessage(code, app.lang.errors.cant_login);
				return false;
			}

			// Unit additional mixins
			// TODO: add accessFlag check
			s.loadLibrary('itemIcon');
			s.loadLibrary('unitSensors');
			s.loadLibrary('itemCustomFields');
			s.loadLibrary('itemAdminFields');
			s.loadLibrary('resourceNotifications');
			s.loadLibrary("unitCommandDefinitions");
			s.loadLibrary('unitEventRegistrar');
			// s.loadLibrary('userNotifications');

			spec = [
				{
						type: 'type',
						data: 'avl_unit_group',
						flags: wialon.util.Number.or.apply(wialon.util.Number, dataFlags),
						mode: 0
				},
				{
						type: 'type',
						data: 'avl_unit',
						flags: wialon.util.Number.or.apply(wialon.util.Number, dataFlags),
						mode: 0
				},
				{
					type: 'type',
					data: 'avl_resource',
					flags: wialon.util.Number.or(
						app.wialon.item.Item.dataFlag.base,
						app.wialon.item.Item.dataFlag.billingProps, // to get creatorId

						app.wialon.item.Resource.dataFlag.notifications
					),
					mode: 0 // mode: 0 – set, 1 – add, 2 – remove
				}
			];

			// Init Wialon events
			s.updateDataFlags(spec, wialonUpdateDataFlagsCallback_);

			// Update locale days & month names
			app.wialon.util.DateTime.setLocale(
				app.lang.locale.days,
				app.lang.locale.months,
				app.lang.locale.days_short,
				app.lang.locale.months_short
			);
		};

		app.wialon.core.Session.getInstance().initSession(baseURL_, appDNS, sessionInitFlags);

		if (authHash_) {
			app.wialon.core.Session.getInstance().loginAuthHash(authHash_, loginCallback);
		} else if (sid_) {
			// Continue current session
			app.wialon.core.Session.getInstance().duplicate(sid_, operateAs, continueCurrentSession, loginCallback);
		} else {
			// Create new session
			app.wialon.core.Session.getInstance().login(user_, password_, operateAs, loginCallback);
		}
	};

	/**
	 * @private
	 * @param  {[type]} errorCode [errorCode]
	 */
	var wialonUpdateDataFlagsCallback_ = function wialonUpdateDataFlagsCallback_(errorCode) {
		if(errorCode) {
			app.core.errorMessage(errorCode, app.wialon.core.Errors.getErrorText(errorCode));
			return;
		}

		// Init modules wialon subsystems
		app.user.initOnWialonLoaded();
		app.notifications.initOnWialonLoaded();
		app.reports.initOnWialonLoaded();

		app.core.appStateRestore(function appStateRestoreCallback(){
			app.units.initOnWialonLoaded();
		});
	};

	// ***************************
	// Public Properties & Methods
	// ***************************

	app.debug = true;

	app.doc = undefined;
	app.$ = undefined;
	app._ = undefined;

	// cached crossmodule jQuery elements, init from pendingCachingElements_ in core.initDOM_
	app.core.$c = {};

	app.core.DEFAULT_FIXED_TO = 1;

	app.core.LANG_INTERPOLATE = {
		interpolate: /%%(.+?)%%/g
	},

	app.core.display_errors = true;

	app.core.blockUnload = {
		enabled: false,
		enable: (function(){
			var
				TIMEOUT = 5000,
				intervalId = false,
				handler = function(){
					app.core.blockUnload.enabled = false;
					intervalId = false;
				};

			return function(){
				app.core.blockUnload.enabled = true;
				if (intervalId) {
					window.clearInterval(intervalId);
				}
				intervalId = window.setInterval(handler, TIMEOUT);
			};
		}())
	};

	/**
	 * Start the application
	 * @param  {object} document document object
	 * @param  {object} jQuery   jQuery object
	 * @param  {object} _        underscore object
	 */
	app.core.startApp = function startApp(document, jQuery, _){
		app.doc = document;
		app.$ = jQuery;
		app._ = _;

		// Turn off error messages, especially not completed callbacks for calculateSensors etc.
		window.onbeforeunload = function(event){
			if (app.core.blockUnload.enabled) {
				app.core.blockUnload.enable();
				return '';
			}
			else {
				app.core.display_errors = false;
			}
		};

		// Document ready handler for app
		app.$(function(){
			var
				lang = {
					list: availableLanguages || null,
					cur: app.$.url().param('lang'),
					def: 'en',
				};

			app.langCode = lang.cur && (!lang.list || (lang.list && $.inArray(lang.cur, lang.list) > -1)) ? lang.cur : lang.def;

			app.$('[data-localize]').localize('sensolator', {
				pathPrefix: 'i18n',
				language: 'en',
                callback: function( data, defaultCallback ) {
                    whiteLabelApp( data );
                    defaultCallback(data)
                }
			});

			// Add en language object
			var enLang = app.$.localize.data.sensolator;

			if(app.langCode !== 'en'){

				app.$('[data-localize]').localize('sensolator', {
					pathPrefix: 'i18n',
					language: app.langCode,
                    callback: function( data, defaultCallback ) {
                        whiteLabelApp( data );
                        defaultCallback(data)
                    }
				});

                app.lang = app.$.localize.data.sensolator;

				var mergeLocalize = function(currentLang, defLang){
					var key;
					for(key in defLang){
						if( ! currentLang[key] && defLang[key]){
							currentLang[key] = defLang[key];
						}else{
							if(typeof currentLang[key] === 'object'){
								mergeLocalize(currentLang[key], defLang[key]);
							}
						}

						if ( key === 'sensor_metrics' ) {
							var k;
							for ( k in currentLang['sensor_metrics'] ) {
								if ( ~k.indexOf( 'fuel' ) ) {
									var d = currentLang['sensor_metrics'][k];
									if ( d.lt ) {
										d.l = d.lt;
									}
								}
							}
						}
					}
				};
				mergeLocalize(app.lang, enLang);
				var url = '//apps.wialon.com/plugins/wialon/i18n/'+app.langCode+'.js';
				if( ! $.datepicker){
					// fix for localize
					$.datepicker = {
						regional: {}
					};
				}

				var script = document.createElement('script');
				script.src = url;
				script.onload = function(){
					$(function(){
						var calendarLang = $.datepicker.regional[app.langCode];
						if(calendarLang){
							/* global Calendar */
							Calendar.LANG(app.langCode, app.langCode, {
								fdow: calendarLang.firstDay,
								goToday: calendarLang.currentText,
								today: calendarLang.currentText,         // appears in bottom bar
								wk: "",
								weekend: "0,6",         // 0 = Sunday, 1 = Monday, etc.
								AM: "am",
								PM: "pm",
								mn :  calendarLang.monthNames,
								smn : calendarLang.monthNamesShort,
								dn : calendarLang.dayNames,
								sdn : calendarLang.dayNamesMin
							});
						}
					});
				};

				document.head.appendChild(script);
			} else {
				app.lang = enLang;
			}

			if(window.documentationLink && !window.is_white){
				// Add link to documentation
				app.$('#help').append('<a target="_blank" href="' + window.documentationLink + '"><img src="img/help.png"></a>');
			} else if( window.is_white && APP_CONFIG.help_url_link ) {
                var url = decodeURIComponent( APP_CONFIG.help_url_link );
                app.$('#help').append('<a target="_blank" href="' + url + '"><img src="img/help.png"></a>');
            }

			// precompile lang templated values
			(function(){
				var processLangBranch = function processLangBranch(branch) {
					var
						e;

					for (e in branch) {
						if (typeof branch[e] === 'string') {
							if ( app.core.LANG_INTERPOLATE.interpolate.test(branch[e]) ) {
								branch[e] = app._.template(branch[e], null, app.core.LANG_INTERPOLATE);
								// Reset RegExp global lastIndex
								app.core.LANG_INTERPOLATE.interpolate.lastIndex = 0;
							}
						}
						else if (typeof branch[e] === 'object') {
							processLangBranch(branch[e]);
						}
					}
				};

				processLangBranch(app.lang);
			}());

			initDOM_();

			// Load wialon script
			app.$.getScript(baseURL_ + WIALON_JS_, function() {
				app.wialon = wialon;

				wialonLoadSession_();
			});

			// allow dragging bootstrap modals
			// $('.modal').draggable({
			//     handle: '.modal-header'
			// });
		});
	};

	app.core.closeConfirmText = ko.observable(false);
	app.core.closeConfirmDontSaveAction = ko.observable(false);
	app.core.closeConfirmSaveAction = ko.observable(false);
	app.core.closeConfirmFormValid = ko.observable(false);


	/**
	 * Close confirm dialog show if checkChange() returns true
	 * @param  {(function|boolean)} checkChange checker function, return true/false when true then show window and apply actions, when false calls dontSaveAction without opening the window, or boolean value
	 * @param  {function} dontSaveAction  what to do when don't save button pressed
	 * @param  {function} saveAction      what to do when save button pressed
	 * @param  {?knockoutObservableBoolean}	formValid		knockout observable if false then saveAction button is disabled
	 */
	app.core.closeConfirm = function closeConfirm(checkChange, dontSaveAction, saveAction, formValid, text) {
		var
			doAction = typeof checkChange === 'function' ? checkChange() : Boolean(checkChange);

		!text && (text = app.lang.close_modal_text);
		app.core.closeConfirmText(text);

		if (doAction) {
			app.core.closeConfirmDontSaveAction(dontSaveAction);
			app.core.closeConfirmSaveAction(saveAction);
			app.core.closeConfirmFormValid(ko.isObservable(formValid) ? formValid() : true);

			// Settings changed, show confirm modal
			app.core.$c.close_confirm_modal.modal();
		}
		else {
			app.core.closeConfirmDontSaveAction(false);
			app.core.closeConfirmSaveAction(false);
			app.core.closeConfirmFormValid(true);

			// Settings not changed, perform reset action without prompt
			app.core.callCallback(dontSaveAction);
		}
	};

	/**
	 * Show error message
	 * @param  {string} message
	 */
	app.core.errorMessage = function errorMessage(code, message) {
		if (app.core.display_errors) {
			// alert((code ? app.lang.error + ': #' + code + ' ' : '') + message);
			alert(message);
			return;
		}
	};

	app.core.logWarning = function logWarning(message) {
		console.log(message);
	};

	/**
	 * Execute (call) callback
	 * @param  {Function} callback
	 */
	app.core.callCallback = function callCallback(callback, args) {
		if ( app.$.isFunction(callback) ) {
			callback.apply(this, args);
		}
	};

	/**
	 * Save app state, called whenever app settings or state changed, throttled to serialize_.throttleTime ms
	 */
	app.core.appStateSave = _.throttle(
		(function(){
			var appStateSave = function appStateSave() {
				var
					i,
					moduleName,
					serializeModules_Length = serialize_.modules.length,
					state = {
						modules: {}
					};

				if (!serialize_.allow) {
					return;
				}

				for (i = 0; i < serializeModules_Length; i++) {
					moduleName = serialize_.modules[i];
					state.modules[moduleName] = app[ moduleName ].serialize();
				}

				state = JSON.stringify( serialize_.convertKeys(state, 'short') );

				serialize_.storage.doAction('write', state, function() {});
			};

			return appStateSave;
		}()),
		serialize_.throttleTime,
		{leading: false}
	);

	/**
	 * Reset app state, all settings & widgets reset to their defaults, and then app reloaded
	 */
	app.core.appStateReset = function appStateReset() {
		// Delete all notifications
		app.notifications.deleteAllNotifications(function(){
			// Then delete all settings
			serialize_.storage.doAction('del', function deleteSettingsCallback() {
				location.reload();
			});
		});
	};

	/**
	 * Restore app state, called when app loads
	 */
	app.core.appStateRestore = function appStateRestore(callback) {
		serialize_.storage.doAction('read', function readAppStateCallback(data) {
			var
				parsed = data && JSON.parse(data),
				state = parsed && serialize_.convertKeys(parsed, 'full' ),
				moduleName;

			if (!state) {
				app.desktops.createDesktop();
				app.units.list().length && app.user.showUserSettingsWindow();
			}
			else {
				for (moduleName in state.modules) {
					state.modules[moduleName] = app[moduleName].unserialize( state.modules[moduleName] );
				}
			}

			// now we allow serialization
			serialize_.allow = true;

			app.core.callCallback(callback);
		});
	};

	app.core.serialize = serialize_;

	return app;
})(sensolator || {});

// Sensolator user module
var sensolator = (function(app){
	'use strict';

	app.user = app.user || {};

	// ****************************
	// Private Properties & Methods
	// ****************************

	var
		RESOURCE_FIELD_NAME_ = '__sensolator_resource_id',

		pendingCachingElements_ = {
			user_settings_modal: '#user-settings-modal'
		},

		// Cached DOM elements, initialized from pendingCachingElements_ in units.initDOM()
		$c_ = {};


	// ***************************
	// Public Properties & Methods
	// ***************************

	app.user.currentUser = undefined;
	app.user.currentUserLocale = undefined;
	app.user.currentUserTimeFormat = undefined;
	app.user.currentUserDateFormat = undefined;
	app.user.currentUserDateTimeFormat = undefined;

	// Current user app settings
	app.user.settings = {
		notifications: {
			email: ko.observable(''), // .subscribe( app.core.appStateSave ).target
			phone: ko.observable('')
		}
	};

	// Updated user app settings, printed in user settings window, observables
	app.user.settingsUpdated = {
		notifications: {
			email: ko.observable(''),
			phone: ko.observable('')
		}
	};

	// Updated user app settings validation states, used to enable/disable save settings button
	app.user.settingsUpdatedToValidate = {
		notifications: {
			email: ko.observable(false),
			phone: ko.observable(false)
		}
	};

	// Computed knockout observable, fetches all app.user.settingsUpdatedToValidate observables and checks whether at least one setting state is false
	app.user.settingsUpdatedFormValid = ko.computed(
		(function(){
			var recursiveValidator = function(settingsNode) {
				var
					i;

				for (i in settingsNode) {
					if (typeof settingsNode[i] === 'object') {
						if ( !recursiveValidator( settingsNode[i] ) ) {
							return false;
						}
					}
					else if ( ko.isObservable(settingsNode[i]) && !settingsNode[i]() ) {
						return false;
					}
				}

				return true;
			};

			return function(){
				return recursiveValidator(app.user.settingsUpdatedToValidate);
			};
		}())
	);

	/**
	 * Init desktops DOM elements, called in core.startApp
	 * @return {void}
	 */
	app.user.initDOM = function initDOM() {
		var
			e;

		// Cache commonly used elements
		for (e in pendingCachingElements_) {
			$c_[e] = app.$( pendingCachingElements_[e] );
		}
		// Add remote URL popup shown handler
		$c_.user_settings_modal.on('shown.bs.modal', function () {
			var
				el = app.$(this).find('input:text:visible:first')[0];

			// app.$(this).find('input:text:visible:first').focus();

			el.selectionStart = el.selectionEnd = el.value.length;
		});

		$c_.user_settings_modal.on('keyup', 'input', function(event){
			// Enter key
			if (event.which === 13) {
				$c_.user_settings_modal.find('button.btn-success:enabled').click();
			}
		});
	};

	/**
	 * Init handler on wialon loaded event
	 * here it initialized user settings
	 */
	app.user.initOnWialonLoaded = function initOnWialonLoaded() {
		var
			s = app.wialon.core.Session.getInstance();

		app.user.currentUser = s.getCurrUser();

		app.user.currentUser.getLocale(function(code, locale){
			var
				t;

			!locale && (locale = {});
			!locale.fd && (locale.fd = 'yyyy-MM-dd_HH:mm:ss');
			typeof locale.wd === 'undefined' && (locale.wd = 1);

			app.user.currentUserLocale = locale;
			t = app.wialon.util.DateTime.convertFormat(locale.fd, true);
			t = t.split('_');
			app.user.currentUserDateFormat = t[0];
			app.user.currentUserTimeFormat = t[1];
			app.user.currentUserDateTimeFormat = t[0] + ' ' + t[1];
		});

		// Add user timezone change listener
		app.user.currentUser.addListener(
			'changeCustomProperty',
			function(event){
				var
					i,
					units,
					unitsLength,
					eventData = event.getData();

				switch (eventData.n) {
					case 'tz': // TimeZone
						units = app.units.list();
						for (i = 0, unitsLength = units.length; i < unitsLength; i++) {
							app.units.recalcLastMessage( units[i] );
						}
						break;
				}
			},
			app
		);

		// Cancel user settings
		$c_.user_settings_modal
			.on('hide.bs.modal', function(event){
				$(this).find(':focus').blur();
			});
	};

	/**
	 * Get user notifications resource ID
	 * @return {int} wialon resource id where notifications saved before
	 */
	app.user.getNotificationsResourceId = function getNotificationsResourceId() {
		return app.user.currentUser.getCustomProperty(RESOURCE_FIELD_NAME_) || 0;
	};


	/**
	 * Set notifications resource ID to store notifications to that resource
	 * @param {int}   resourceId id of resource to store to user custom property
	 * @param {function} callback   function executed when request completed
	 */
	app.user.setNotificationsResourceId = function setNotificationsResourceId(resourceId, callback) {
		app.user.currentUser.updateCustomProperty(RESOURCE_FIELD_NAME_, resourceId, callback);
	};

	/**
	 * Serialize the module
	 * @return {object} moduleState object, to restore module use unserialize(moduleState)
	 */
	app.user.serialize = function serialize() {
		if(app.user.settings.version === undefined){
			app.user.settings.version = 2;
		}
		return app.utils.extendKo({}, app.user.settings);
	};

	/**
	 * Restore module state
	 * @param  {object} moduleState object returned from serialize()
	 */
	app.user.unserialize = function unserialize(moduleState) {
		if(moduleState && moduleState.version === undefined || moduleState.version === 1){
			app.user.settings.version = 1;
		}else{
			app.user.settings.version = 2;
		}
		app.utils.extendKo(app.user.settings, moduleState);
		app.utils.extendKo(app.user.settingsUpdated, app.user.settings);

		return app.user.settings;
	};

	/**
	 * Show user setting popup window
	 */
	app.user.showUserSettingsWindow = function showUserSettingsWindow() {
		$c_.user_settings_modal.modal();
	};

	/**
	 * Whether the current user notification settings have been changed
	 * @return {boolean} true - settings changed, false - otherwise
	 */
	app.user.isSettingsChanged = function isSettingsChanged() {
		var
			s,
			section;

		for (section in app.user.settingsUpdated) {
			for (s in app.user.settingsUpdated[section]) {
				if ( app.user.settingsUpdated[section][s]() !== app.user.settings[section][s]() ) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Save user settings
	 * @return {[type]} [description]
	 */
	app.user.settingsSave = function settingsSave(scope, event) {
		var
			i;

		app.user.settings.version = 2;

		app.utils.extendKo(app.user.settings, app.user.settingsUpdated);

		for (i in app.user.settings.notifications) {
			app.user.settings.notifications[i]( app.$.trim( app.user.settings.notifications[i]() ) );
		}

		$c_.user_settings_modal.modal('hide');

		app.core.appStateSave();
	};

	/**
	 * Don't save user setting
	 */
	app.user.settingsDontSave = function settingsDontSave() {
		app.utils.extendKo(app.user.settingsUpdated, app.user.settings);
		$c_.user_settings_modal.modal('hide');
	};

	return app;
})(sensolator || {});

// Sensolator map module
var sensolator = (function(app){
	'use strict';

	app.map = app.map || {};

	// ****************************
	// Private Properties & Methods
	// ****************************

	var
		MIN_ZOOM_LEVEL_ = 3,
		DEFAULT_ZOOM_LEVEL_ = 12,
		DEFAULT_CENTER_ = [52.32728615559, 9.798388481140],
		map_, // map object
		currentTileType_ = 'gurtam', // init tile type
		_mapsHandlers = [],
		markers = [];

	// ***************************
	// Public Properties & Methods
	// ***************************

	app.map.DEFAULT_TILE_TYPE = currentTileType_;

	/**
	 * Load map
	 * @param {float} mapState.lat Latitude
	 * @param {float} mapState.lng Longitude
	 * @param {int} mapState.zoom Zoom level
	 * @param {string} mapState.tileType Tile type: "osm" or "gurtam"
	 * @param {function} callback
	 */
	app.map.loadMap = function loadMap(mapState, callback) {
		var
			tile;

		map_ = L.map(app.desktops.BG_HOLDER.substr(1), {
			zoomControl: false,
			zoom: DEFAULT_ZOOM_LEVEL_,
			center: DEFAULT_CENTER_
		});

		// Add zoomControl
		map_.addControl( L.control.zoom({
			zoomInTitle: app.lang.zoom_in_title,
			zoomOutTitle: app.lang.zoom_out_title
		}) );

		if (mapState && mapState.tileType) {
			currentTileType_ = mapState.tileType;
		}

		// Load tiles
		switch (currentTileType_) {
			case 'osm':
			case 'gurtam':
				tile = L.tileLayer.webGis(app.wialon.core.Session.getInstance().getBaseGisUrl('render'), {
					attribution: window.APP_CONFIG && window.APP_CONFIG.alias_webgis ? 'WebGis' : 'Gurtam Maps',
					minZoom: MIN_ZOOM_LEVEL_,
					userId: app.user.currentUser.getId(),
					sessionId: app.wialon.core.Session.getInstance().getId()
				});
				break;
			case 'osm2':
				tile = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
					minZoom: MIN_ZOOM_LEVEL_
				});
				break;
		}
		tile.addTo( map_ );

		// Restore mapState
		if (mapState && (typeof mapState.lat !== 'undefined') && (typeof mapState.lng !== 'undefined') && (typeof mapState.zoom !== 'undefined')) {
			// restore position and zoom if provided
			map_.setView([mapState.lat, mapState.lng], mapState.zoom);
		}
		else {
			app.map.extentToUnits( app.units.list() );
		}

		// Subscribe to map events
		map_.on('dragend', app.core.appStateSave);
		map_.on('zoomend', app.core.appStateSave);
		map_.on('dblclick', function(map){
			var curr_coord = {
				x: map.latlng.lng,
				y: map.latlng.lat
			};

			if ( _mapsHandlers.length ) {
				var preventDef = false;
				// for(var i=0; i < _mapsHandlers.length; i++){
				while(_mapsHandlers.length){
					var handler = _mapsHandlers.shift();
					if(!handler(curr_coord))
						preventDef = true;
				}

				if(preventDef){
					map.originalEvent.preventDefault();
					map.originalEvent.stopPropagation();
					map.type = false;

					// disable dbclick
					map_.doubleClickZoom.disable();
					setTimeout(function(){
						// enable dbclick
						map_.doubleClickZoom.enable();
					}, 200);
					return false;
				}
			}
		});
	};

	app.map.addHandlerDbClickToMap = function(handler){
		if(typeof handler === 'function'){
			_mapsHandlers.push(handler);
			// map_.on('click', handler);
		}
	};
	/**
	 * Destroy map
	 */
	app.map.destroy = function destroy() {
		if (!map_) {
			app.core.logWarning('Attempt to destroy not existing map');
		}

		map_ && map_.remove();
	};

	/**
	 * Get map current state, use it to restore this state later
	 * @return {{lat: float, lng: float, zoom: int, tileType: string}}
	 */
	app.map.getMapState = function getMapState() {
		if (!map_) {
			return false;
		}

		var
			center = map_.getCenter(),
			mapState = {
				lat: center.lat,
				lng: center.lng
			};

		mapState.zoom = map_.getZoom();
		mapState.tileType = currentTileType_;

		return mapState;
	};

	/**
	 * Create marker of wialon unit
	 * @param  {object} unit wialon unit object
	 */
	app.map.createUnitMarker = function createUnitMarker(unit) {
		var
			marker,
			icon,
			pos = unit.getPosition();

		if (map_ && unit && unit.getPosition()) {
			var iconUrl = unit.getIconUrl();
			icon = L.icon({
			    iconUrl: iconUrl,
			    iconRetinaUrl: iconUrl,
			    iconSize: [32, 32],
			    iconAnchor: [16, 16],
			    popupAnchor: [60, -100]
			    // labelAnchor: [-48, 32]
			    // shadowUrl: 'my-icon-shadow.png',
			    // shadowRetinaUrl: 'my-icon-shadow@2x.png',
			    // shadowSize: [48, 48],
			    // shadowAnchor: [32, 32]
			});


			if (!pos) {
				// app.core.errorMessage(null, app.lang.errors.cant_get_unit_pos);
				return false;
			}

			marker = L.marker([pos.y, pos.x], {icon: icon}).bindLabel(
				unit.getName(),
				{
					noHide: true,
					direction: 'right',
					clickable: true,
					onClick: function(event) {
						app.units.unitWindowShow(unit);
					}
				});

			marker.on('click', function(event) {
				app.units.unitWindowShow(unit);
			});

			marker.addTo(map_);
			markers[ unit.getId() ] = marker;
		}
	};

	/**
	 * Create map markers of wialon units
	 * @param  {(object|array)} units wialon units collection
	 */
	app.map.createUnitMarkers = function createUnitMarkers(units) {
		var
			i;

		for (i in units) {
			app.map.createUnitMarker( units[i] );
		}
	};

	/**
	 * Set map view to wialon unit, see leaflet docs for difference between setView and panTo
	 * @param {[type]} unit [d
	 */
	app.map.setViewToUnit = function setViewToUnit(unit) {
		var
			pos = unit.getPosition();

		if (!pos) {
			// app.core.errorMessage(null, app.lang.errors.cant_get_unit_pos);
			return false;
		}
		else {
			map_.setView( new L.LatLng(pos.y, pos.x), DEFAULT_ZOOM_LEVEL_);
		}
	};

	/**
	 * Pan map to wialon unit
	 * @param  {object} unit wialon unit object
	 */
	app.map.panToUnit = function panToUnit(unit) {
		var
			pos = unit.getPosition();

		if (!pos) {
			// app.core.errorMessage(null, app.lang.errors.cant_get_unit_pos);
			return false;
		}
		else {
			map_.panTo( new L.LatLng(pos.y, pos.x) );
		}
	};

	/**
	 * Extent map to wialon units
	 * @param  {(object|array)} units collection of wialon units
	 */
	app.map.extentToUnits = function extentToUnits(units) {
		var
			i,
			pos,
			LatLngs = [],
			bounds;

		for (i in units) {
			pos = units[i].getPosition();
			if (pos) {
				LatLngs.push([pos.y, pos.x]);
			}
		}

		if ( LatLngs.length > 1 ) {
			bounds = new L.LatLngBounds(LatLngs);
			bounds = bounds.pad(0.3); // enlarge bounds to show units in center but not in the corners

			map_.fitBounds(bounds);
		}
		else if ( LatLngs.length === 1) {
			for (i in units) {
				app.map.setViewToUnit( units[i] );
				break;
			}
		}
		else {
			// No units, then show whole world
			map_.fitWorld({
				reset: true
			});
		}
	};

	/**
	 * Remove wialon unit marker
	 * @param  {object} unit wialon unit object
	 */
	app.map.removeUnitMarker = function removeUnitMarker(unit) {
		var
			unitId = unit.getId();

		if ( markers[unitId] ) {
			map_.removeLayer( markers[unitId] );
			markers[unitId] = false;
		}
	};


	/**
	 * Move unit marker to current position
	 * @param  {object} unit wialon unit object
	 */
	app.map.moveUnitMarker = function moveUnitMarker(unit) {
		app.map.removeUnitMarker(unit);
		app.map.createUnitMarker(unit);
	};

	return app;
})(sensolator || {});

// Units module
var sensolator = (function(app){
	'use strict';

	app.history = app.history || {};

	// ****************************
	// Private Properties & Methods
	// ****************************

	var
		listById_ = {},
		MAX_DATA_POINTS_ = 100000;

	var SensorHistory_ = (function(){
		var SensorHistoryClass = function SensorHistoryClass(unitId, sensorId) {
			this.uId = unitId;
			this.sId = sensorId;
			this.data = [];
			// Period violations
			this.eViolations = {};
			// Period violations
			this.eViolationsArr = [];
		};

		var loadMessages_ = (function(){
			var
				waitingUnload_ = false,
				waitingCallParams_ = {set: false};

			var unloadCallback_ = function unloadCallback_() {
				waitingUnload_ = false;
				if (waitingCallParams_.set) {
					loadMessagesHandler(waitingCallParams_.historyObj, waitingCallParams_.interval, waitingCallParams_.callback);
					waitingCallParams_ = {set: false};
				}
			};

			var loadMessagesHandler = function loadMessagesHandler(historyObj, interval, callback) {
				var
					// Get MessagesLoader
					messageLoader = new app.wialon.core.MessagesLoader(),
					s = app.wialon.core.Session.getInstance(),
					item = s.getItem(historyObj.uId);

				if ( !app._.contains( app.reports.units_list, item ) || !app.reports.resources || !app.reports.resources.length) {
					//app.core.errorMessage(7, app.lang.errors.performing_request);
					return;
				}

				if (waitingUnload_) {
					waitingCallParams_ = {
						set: true,
						historyObj: historyObj,
						interval: interval,
						callback: callback
					};
					return;
				}
				else {
					waitingUnload_ = true;
				}

				historyObj.periodData = [];

				var mu = 0;
				try {
					var ids = app.units.currentSensor().usId.split('_');
					mu = JSON.parse(app.units.sensorsInfo[ids[0]][ids[1]].c).mu || 0;
				} catch(e) { }

				var
					_loaded = false,
					results = [],
					_checkCallback = function() {
						if ( _loaded ) {
							// // Add data messages
							for (var i = 0, mLength = results.length; i < mLength; i++) {
								// check for invalid value
								if (results[i][1] === -348201.39) {
									continue;
								}
								historyObj.periodData.push({
									x: results[i][0],
									y: Math.round(results[i][1] * 10) / 10
								});
							}

							// Load notifications (registered events for unit as violations)
							messageLoader.loadInterval(
								historyObj.uId,
								interval.timeFrom + historyObj.periodOffset,
								interval.timeTo + historyObj.periodOffset,
								0x0601, // registered event && ty
								0xFFFF, // full match, don't skip any bits
								0, // max data points
								function(mnCode, mnResult) {
									var
										i, l;

									historyObj.eViolations = {};
									historyObj.eViolationsArr = [];

									if (mnCode) {
										app.core.errorMessage(mnCode, app.lang.errors.cant_load_interval_to_fetch_notifications);
										return;
									}

									if (mnResult.count) {
										messageLoader.getMessages(0, mnResult.count-1, function(mnmCode, mnmRes){
											var
												t,
												match,
												sensorName = app.units.watchSensors[historyObj.uId][historyObj.sId].name,
												// regexp to test and fetch sensor value
												reg = new RegExp('^' + sensorName + app.notifications.NOTIFICATION_TEXT_DELIMITER + '(.+)');

											if (mnmCode) {
												app.core.errorMessage(mnmCode, app.lang.errors.cant_get_registered_events_to_fetch_notifications);
												return;
											}

											// Filter only needed messages by name & fetch sensor value
											for (i = 0, l = mnmRes.length; i < l; i++) {
												match = mnmRes[i].et.match(reg);
												if (match) {
													// HACK: fetch number value & round it
													t = match[1].match(/^([0-9]+\.?[0-9]*)\s?(.*)/);
													if (t) {
														t[1] = Number(t[1]).toFixed(app.core.DEFAULT_FIXED_TO);
														t[1] % 1 === 0 &&
															(t[1] = parseInt(t[1], 10));
														match[1] = t[1] + (t[2].length ? ' ' + t[2] : '');
													}

													historyObj.eViolations[ mnmRes[i].t ] = match[1];
													historyObj.eViolationsArr.push({
														time: mnmRes[i].t,
														val: match[1]
													});
												}
											}

											app.core.callCallback(callback);
											messageLoader.unload(unloadCallback_);
										});
									}
									else {
										app.core.callCallback(callback);
										messageLoader.unload(unloadCallback_);
									}
								}
							);
						}
					},
					spec_ = [ {
							svc: 'report/cleanup_result',
							params: {}
						}, {
							svc: 'report/exec_report',
							params: {
								// get first resource in which we could execute report
								reportResourceId: app.reports.resources[0].data,
								reportTemplateId: 0,
								reportTemplate: {
									id: 0,
									n: 'SensolatorReport',
									ct: 'avl_unit',
									p: '',
									tbl: [{
										n: 'unit_stats',
										l: 'Statistics',
										f: 0,
										c: '',
										cl: '',
										p: '{"us_units":' + mu + '}',
										sch: { y: 0, m: 0, w: 0, f1: 0, f2: 0, t1: 0, t2: 0 },
										sl:"[]",
										s:"[\"us_units\"]"
									}, {
										n: 'unit_sensors_tracing',
										l: 'Sensor tracing',
										f: 0,
										c: 'time_begin,sensor_value',
										cl: 'Time,Value',
										sch: { y: 0, m: 0, w: 0, f1: 0, f2: 0, t1: 0, t2: 0 },
										p: '{"interval":{"value":0,"skip_error":0,"separate_columns":0},"sensor_name":"'+ app.units.currentSensor().name +'","geozones_ex":{"split":0}}',
										sl: '', s: ''
									}]
								},
								reportObjectId: historyObj.uId,
								reportObjectSecId: 0,
								interval: {
									flags: app.wialon.item.MReport.intervalFlag.absolute,
									from: interval.timeFrom + historyObj.periodOffset,
									to: interval.timeTo + historyObj.periodOffset,
								}
							}
						}, {
							svc: 'report/select_result_rows',
							params: {
								tableIndex: 0,
								config: {
									type: 'range',
									data: {
										from: 0,
										to: 0xffffff,
										level: 0
									}
								}
							}
						} ];
				// Execute report
				app.wialon.core.Remote.getInstance().remoteCall( 'core/batch', {
					params: spec_,
					flags: 0
				}, function( code, data ) {
					if ( code ) {
						app.core.errorMessage(code, app.lang.errors.performing_request);
						return;
					}
					if ( !app._.isArray( data[2] ) || !data[2].length ) {
						app.core.callCallback(callback);
						messageLoader.unload(unloadCallback_);
						return;
					}

					_loaded = true;
					results = app._.map( data[2], function( p ) {
						return [ p.t1, parseFloat( p.c[1] ) ];
					} );
					if ( results && results.length ) {
						results = results.filter(function( d ){
							return !isNaN( d[0] ) && !isNaN( d[1] );
						});
					}
					_checkCallback();
				} );
			};

			return loadMessagesHandler;
		}());

		SensorHistoryClass.prototype.uId = undefined;
		SensorHistoryClass.prototype.sId = undefined;
		SensorHistoryClass.prototype.period = undefined;
		SensorHistoryClass.prototype.periodOffset = 0;
		SensorHistoryClass.prototype.periodData = [];
		SensorHistoryClass.prototype.min = undefined;
		SensorHistoryClass.prototype.max = undefined;
		SensorHistoryClass.prototype.timeFrom = undefined;
		SensorHistoryClass.prototype.timeTo = undefined;
		SensorHistoryClass.prototype.data = [];
		SensorHistoryClass.prototype.eViolations = {}; // event violations object by time, catched from unit
		SensorHistoryClass.prototype.eViolationsArr = [];

		SensorHistoryClass.prototype.addItem = function(sensorValue, time) {
			time = parseInt(time, 10);

			var
				i,
				dataLength = this.data.length,
				newItem = {
					time: time,
					val: sensorValue
				};

			if ( !dataLength ) {
				this.data.push(newItem);
				this.timeFrom = time;
				this.timeTo = this.timeFrom;
				this.min = sensorValue;
				this.max = this.min;
				return;
			}

			if (time < this.timeFrom) {
				// Add element to the beginning
				this.data.unshift(newItem);
				this.timeFrom = time;
			}
			else if (time > this.timeTo) {
				this.data.push(newItem);
				this.timeTo = time;
			}
			else if (time === this.timeFrom) {
				this.data[0].val = sensorValue;
			}
			else if (time === this.timeTo) {
				this.data[ this.data.length-1 ].val = sensorValue;
			}
			else {
				// find position where we want to insert newItem
				for (i = 0; i < dataLength; i++) {
					if (time <= this.data[i].time) {
						if (time === this.data[i].time) {
							this.data[i].val = sensorValue;
						}
						else {
							// Insert item to i position
							this.data.splice(i, 0, newItem);
						}
						break;
					}
				}
			}

			// Update min
			if ( sensorValue < this.min ) {
				this.min = sensorValue;
			}
			// Update max
			else if ( sensorValue > this.max ) {
				this.max = sensorValue;
			}

			// Delete old/overlimited values
			while (this.data.length > MAX_DATA_POINTS_ && this.data.length) {
				// Remove first element
				this.data.shift();
			}
			// TODO: delete this & add check for today
			// this.shiftToTimeFrom( getPeriodInterval_(this.period).timeFrom );
		};

		/**
		 * Shift old unneccessary data to timeFrom
		 * @param  {unixtime} timeFrom the time to shift old data to, not including
		 * @return {boolean}  true on shifted items or this.timeFrom ==== timeFrom, false on timeFrom is less than this.timeFrom
		 */
		// TODO: DELETE it when definitely not needed
		// SensorHistoryClass.prototype.shiftToTimeFrom = function(timeFrom) {
		//  timeFrom = parseInt(timeFrom);

		//  var
		//      i,
		//      dataLength = this.data.length,
		//      res = false;

		//  if (timeFrom >= this.timeFrom) {
		//      for (i = 0; i < dataLength && timeFrom > this.data[i].time; i++) {};
		//      --i;
		//      if (i >= 0) {
		//          this.data.splice(0, i+1);
		//          if (this.data.length) {
		//              this.timeFrom = this.data[0].time;
		//          }
		//          else {
		//              this.timeFrom = undefined;
		//              this.timeTo = undefined;
		//          }
		//      }

		//      res = true;
		//  }

		//  return res;
		// };

		SensorHistoryClass.prototype.changePeriod = function changePeriod(period, onChangePeriod, onLoadData) {
			this.periodOffset = 0;

			// if (this.period === period) {
			//  // app.core.callCallback(callback);
			//  return;
			// }

			var
				interval = getPeriodInterval_(period);

			this.period = period;

			app.core.callCallback(onChangePeriod);

			// TODO: delete shiftToTimeFrom
			// if ( this.shiftToTimeFrom(interval.timeFrom) ) {
			//  app.core.callCallback(onLoadData);
			//  return;
			// }

			// If the user has access to messageLoader.loadInterval
			if ( app.wialon.util.Number.and(app.user.currentUser.getUserAccess(), app.wialon.item.Item.accessFlag.execReports) || app.debug) {
				loadMessages_(this, interval, onLoadData);
			}
			// else {
			//  app.core.callCallback(onLoadData);
			// }
		};

		SensorHistoryClass.prototype.periodOffsetPlus = function periodOffsetPlus(onChangePeriod, onLoadData) {
			switch (this.period) {
				case 'today':
					this.periodOffset += 86400;
					break;
				case 'yesterday':
					if (this.periodOffset === 0) {
						this.period = 'today';
					}
					else {
						this.periodOffset += 86400;
					}
					break;
				case 'one_week':
					this.periodOffset += 604800;
					break;
			}

			app.core.callCallback(onChangePeriod);

			loadMessages_(this, getPeriodInterval_(this.period), onLoadData);
		};

		SensorHistoryClass.prototype.periodOffsetMinus = function periodOffsetMinus(onChangePeriod, onLoadData) {
			switch (this.period) {
				case 'today':
					if (this.periodOffset === 0) {
						this.period = 'yesterday';
					}
					else {
						this.periodOffset -= 86400;
					}
					break;
				case 'yesterday':
					this.periodOffset -= 86400;
					break;
				case 'one_week':
					this.periodOffset -= 604800;
					break;
			}

			app.core.callCallback(onChangePeriod);

			loadMessages_(this, getPeriodInterval_(this.period), onLoadData);
		};

		SensorHistoryClass.prototype.getPeriodText = function getPeriodText() {
			var
				res = '',
				period = getPeriodInterval_(this.period);

			res += app.wialon.util.DateTime.formatDate(
				app.wialon.util.DateTime.userTime(period.timeFrom + this.periodOffset) - app.wialon.util.DateTime.getTimezoneOffset() - app.wialon.util.DateTime.getDSTOffset(),
				app.user.currentUserDateFormat
			);

			if (this.period === 'one_week') {
				res += app.lang.time_range_delimiter;
				res += app.wialon.util.DateTime.formatDate(
								app.wialon.util.DateTime.userTime(period.timeTo + this.periodOffset) - app.wialon.util.DateTime.getTimezoneOffset() - app.wialon.util.DateTime.getDSTOffset(),
								app.user.currentUserDateFormat
							 );
			}

			return res;
		};

		SensorHistoryClass.prototype.getLast = function getLast() {
			var
				res,
				last = this.data[ this.data.length-1 ];

			if (last) {
				res = {
					time: last.time,
					val: last.val,
					isValid: (last.val === app.wialon.item.MUnitSensor.invalidValue ? false : true)
				};
			}
			else {
				res = {
					time: undefined,
					val: app.wialon.item.MUnitSensor.invalidValue,
					isValid: false
				};
			}

			return res;
		};

		SensorHistoryClass.prototype.getLastValid = function getLastValid() {
			var
				i;

			for (i = this.data.length - 1; i > -1; i--) {
				if (this.data[i].val !== app.wialon.item.MUnitSensor.invalidValue) {
					return {
						time: this.data[i].time,
						val: this.data[i].val,
						isValid: true
					};
				}
			}

			return false;
		};

		/**
		 * Get unit sensor history data for rendering
		 * @return {array} of {x: floatVal, y: floatVal} to draw
		 */
		SensorHistoryClass.prototype.getDataXY = function getDataXY(limit) {
			var
				dataLength = this.data.length,
				i = (!limit || limit >= dataLength) ? 0 : dataLength - limit,
				res = {
					data: [],
					min: this.min,
					max: this.max
				};

			for (; i < dataLength; i++) {
				res.data.push({
					x: this.data[i].time,
					y: this.data[i].val
				});
			}

			return res;
		};

		return SensorHistoryClass;
	}());

	var createHistoryObject_ = function createHistoryObject_(unitId, sensorId) {
		if ( !listById_[unitId] ) {
			listById_[unitId] = {};
		}
		if ( listById_[unitId][sensorId] ) {
			listById_[unitId][sensorId].data = {};
		}
		else {
			listById_[unitId][sensorId] = new SensorHistory_(unitId, sensorId);
		}

		return listById_[unitId][sensorId];
	};

	/**
	 * Get unixtime from and to based on period
	 * @private
	 * @param  {string} period one of the app.history.periods
	 * @return {object} {{timeFrom: unixtime, timeTo: unixtime}}
	 */
	var getPeriodInterval_ = function getPeriodInterval_(period) {
		var
			WEEK_DAYS = 7,
			DAY_SECONDS = 86400,
			SECOND_MILISECONDS = 1000,
			day,
			timeFrom,
			timeTo,
			/* global get_today */
			today = get_today(),
			/* global get_user_now_print_time */
			userTime = get_user_now_print_time(); // UTC time

		if (typeof period === 'undefined') {
			timeFrom = false;
			timeTo = false;
		}
		else {
			// yesterday or today starting from 0:00 am for the user timezone with DST
			// Get today abs time
			timeFrom = today.from;

			if (period === 'today') {
				timeTo = today.to;
			}
			else if (period === 'yesterday') {
				timeTo = timeFrom - 1; // minus 1 second
				timeFrom = timeFrom - DAY_SECONDS;
			}
			else if (period === 'one_week') {
				day = (new Date(userTime.from * SECOND_MILISECONDS)).getDay();
				timeFrom += (- day + (day === 0 ? -6 : 1) + (app.user.currentUserLocale.wd === WEEK_DAYS ? -1 : 0) - WEEK_DAYS) * DAY_SECONDS; // The week before the current
				timeTo = timeFrom + WEEK_DAYS * DAY_SECONDS - 1;
			}
		}

		return {
			timeFrom: timeFrom,
			timeTo: timeTo
		};
	};

	// ***************************
	// Public Properties & Methods
	// ***************************

	app.history.periods = [
		'today',
		'yesterday',
		'one_week'
	];

	// Default period to show in sensor info window
	app.history.DEFAULT_PERIOD = app.history.periods[0];

	/**
	 * Get the maximum data points to store in history
	 * @return {int} number of data points
	 */
	app.history.getMaxDataPoints = function getMaxDataPoints() {
		return MAX_DATA_POINTS_;
	};

	/**
	 * Get unit sensor history object
	 * @param  {int} unitId   wialon unit ID
	 * @param  {int} sensorId wialon unit sensor ID of unit with unitId
	 * @return {object}       history object
	 */
	app.history.getHistoryObject = function getHistoryObject(unitId, sensorId) {
		if (!listById_[unitId] || !listById_[unitId][sensorId]) {
			createHistoryObject_(unitId, sensorId);
		}

		return listById_[unitId][sensorId];
	};

	return app;
})(sensolator || {});

// Sensolator notifications module
var sensolator = (function(app){
	'use strict';

	app.notifications = app.notifications || {};

	// Public constants used in private properties o_O)
	app.notifications.NOTIFICATION_TEXT_DELIMITER = '~';

	// ****************************
	// Private Properties & Methods
	// ****************************

	var
		NOTIFICATION_NAME_PREFIX_ = '__app__sensolator',
		NOTIFICATION_NAME_PREFIX_OLD_ = '__sensolator',
		notification_name_regexp_ = new RegExp('(__app){0,1}' + NOTIFICATION_NAME_PREFIX_OLD_ + '_([0-9]+)_(.+)'),

		pendingCachingElements_ = {
			desktop_notifications: '#desktop-notifications',
			desktop_notifications_table: '#desktop-notifications-table', // TODO: add holder and cache it via $
		},

		// Cached DOM elements, initialized from pendingCachingElements_ in units.initDOM()
		$c_ = {},

		/* 0 - уведомление срабатывает на первое сообщение, 1 - уведомление срабатывает на каждое сообщение, 2 - уведомление выключено */
		NOTIFICATION_ON_STATE_ = 0,
		NOTIFICATION_OFF_STATE_ = 2,

		NOTIFICATION_IN_RANGE_ = '0',
		NOTIFICATION_OUT_OF_RANGE_ = '1',

		DESKTOP_NOTIFICATIONS_ROW_HEIGHT_ = '20px',
		DESKTOP_NOTIFICATIONS_MAX_VISIBLE_ROWS_ = 8,
		DESKTOP_NOTIFICATIONS_LIMIT_ = 1000,
		DESKTOP_NOTIFICATIONS_REDRAW_THROTTLE_TIME_ = 100,

		// Allow updating notification only when data loaded from wialon
		notification_update_allow_ = false,

		notification_create_options_ = {
			// id: 0, /* ID уведомления */
			// need to fill in with computed name
			n: '', /* название */
			txt: '%SENSOR_NAME%' + app.notifications.NOTIFICATION_TEXT_DELIMITER + '%SENSOR_VALUE%',
			ta: 0, /* время активации (UNIX формат) */
			td: 0, /* время деактивации (UNIX формат) */
			ma: 0, /* максимальное количество срабатываний (0 - не ограничено) */
			mmtd: 0, /* максимальный временной интервал между сообщениями (секунд) */
			cdt: 0, /* таймаут срабатывания(секунд) */
			mast: 0, /* минимальная продолжительность тревожного состояния (секунд) */
			mpst: 0, /* минимальная продолжительность предыдущего состояния (секунд) */
			cp: 0,/* период контроля относительно текущего времени (секунд) */
			fl: NOTIFICATION_OFF_STATE_,
			tz: 0, /* часовой пояс */
			la: 'en', /* язык пользователя (двухбуквенный код) */
			// ac: 0, /* количество срабатываний */
			sch: { /* ограничение по времени */
				f1: 0,	/* время начала интервала 1 */
				f2: 0,	/* время начала интервала 2 */
				t1: 0,	/* время окончания интервала 1 */
				t2: 0,	/* время окончания интервала 2 */
				m: 0,	/* маска дней месяца */
				y: 0,	/* маска месяцев */
				w: 0/* маска дней недели */
			},
			un: [], // array of unit IDs to attach to
			act: [
				{
					t:'message',
					p:{
						color:'#ffeb99',
						// Replaced with notification name
						name:'Sensolator notification',
						url:''
					}
				},
				{
					t: 'event',
					p: {
						flags: 1 /* зарегистрировать как: 0 - событие, 1 - нарушение */
					}
				}
			],
			trg: {
				t: 'sensor_value',
				p: {
					lower_bound: '-1',
					merge: '0',
					// need to fill in with sName - sensor name
					sensor_name_mask: '',
					sensor_type: '',
					type: NOTIFICATION_IN_RANGE_,
					upper_bound: '1'
				}
			}
		},

		notification_default_actions_ = [
			{
				t: 'message',
				p: {
					color: '#ffeb99',
					// Replaced with notification name
					name: 'Sensolator notification',
					url: ''
				}
			},
			{
				t: 'event',
				p: {
					flags: 1 /* зарегистрировать как: 0 - событие, 1 - нарушение */
				}
			},
			{
				t: 'email',
				p: {
					email_to: '',
					html: '0',
					img_attach: '0',
					// Replaced with notification name
					subj: 'Sensolator notification'
				}
			},
			{
				t: 'sms',
				p: {
					phones: ''
				}
			}
		],

		desktopDataTable_,
		desktopDataTableRedraw_	= _.throttle(
			function desktopDataTableRedraw_(){
				var
					rowsCnt = desktopDataTable_.fnSettings().fnRecordsTotal(),
					visibleRows = (rowsCnt > 0 ? (rowsCnt < DESKTOP_NOTIFICATIONS_MAX_VISIBLE_ROWS_ ? rowsCnt : DESKTOP_NOTIFICATIONS_MAX_VISIBLE_ROWS_): 1),
					sY = desktopDataTable_.fnSettings().oScroll.sY,
					new_sY = parseInt(DESKTOP_NOTIFICATIONS_ROW_HEIGHT_, 10) * visibleRows + 'px';

				if (sY !== new_sY) {
					desktopDataTable_.fnSettings().oScroll.sY = new_sY;
					desktopDataTable_.closest('div.dataTables_scrollBody').css('height', new_sY);
					desktopDataTable_.fnAdjustColumnSizing();
				}

				desktopDataTable_.fnDraw();
			},
			DESKTOP_NOTIFICATIONS_REDRAW_THROTTLE_TIME_,
			{leading: false}
		);

	/**
	 * Create sensor notification
	 * @param  {object} data notification data
	 * @param  {Function} success callback function on success
	 * @param  {Function} error callback function on error
	 */
	var createSensorNotification_ = function createSensorNotification_(data, success, error) {
		app.notifications.resource.createNotification(data, function(errorCode, notification){
			if (errorCode) {
				app.core.errorMessage(errorCode, app.lang.errors.cant_create_notification);
				app.core.callCallback(error);
			}
			else {
				app.core.callCallback(success);
				app.notifications.resource.getNotificationsData( [notification.id], getNotificationsDataCallback_ );
			}
		});
	};

	/**
	 * Get sensor notification, if no args passed then get notification for units.currentSensor,
	 * if notification is not created then return object with default notification settings
	 * @param  {?int} uId   wialon unit ID
	 * @param  {?int} sName wialon sensor ID for unit with uId
	 * @return {object}       wialon full data notification object
	 */
	var getSensorNotification_ = function getSensorNotification_(uId, sName) {
		var
			res = false,
			sId,
			currentSensor;

		uId = parseInt(uId, 10);

		if (!uId || !sName) {
			currentSensor = app.units.currentSensor();

			if (!currentSensor) {
				return res;
			}

			uId = parseInt( currentSensor.indicator.uId, 10);
			sName = currentSensor.indicator.name;
			sId = currentSensor.indicator.sId;
		}

		// If we have counter or can't create notification for unit, then exit
		if ( !Number(sId) || !app.wialon.util.Number.and(app.wialon.core.Session.getInstance().getItem(uId).getUserAccess(), app.wialon.item.Unit.accessFlag.monitorState) ) {
			return res;
		}

		if (
				app.notifications.resource &&
				app.notifications.listByUIdSName[uId] &&
				app.notifications.listByUIdSName[uId][sName]
			 ) {
			res = app.notifications.listByUIdSName[uId][sName];
		}
		else {
			// create notification with default settings but not store it to server
			res = app.$.extend(true, {}, notification_create_options_);

			res.n = NOTIFICATION_NAME_PREFIX_ + '_' + uId + '_' + sId; // + '_' + sName
			res.act[0].p.name = res.n;
			res.un.push( uId );
			res.trg.p.sensor_name_mask = sName;
			res.la = app.langCode;
			res.ta = app.wialon.core.Session.getInstance().getServerTime();
			// res.td = res.ta + 3600*24*7; // One week
			res.td = res.ta + 631138519; // 20 years
			// res.tz = app.wialon.util.DateTime.getTimezone();

			app.notifications.listByUIdSName[uId] || (app.notifications.listByUIdSName[uId] = {});
			app.notifications.listByUIdSName[uId][sName] = res;
		}

		return res;
	};

	/**
	 * Get full data for notifications, used as callback for resource.getNotificationsData
	 * @param  {int} code wialon error code
	 * @param  {array} notifications array of wialon notification objects
	 * TODO: mb create notification & store its ID to app state
	 */
	var getNotificationsDataCallback_ = function getNotificationsDataCallback_(code, notifications) {
		var
			i,
			j,
			notificationsLength,
			sName,
			uId,
			uIdsLength,
			nId;

		if (code) {
			// app.core.errorMessage(code, app.lang.errors.cant_get_notifications_data);
			return;
		}

		for (i = 0, notificationsLength = notifications.length; i < notificationsLength; i++) {
			sName = notifications[i].trg.p.sensor_name_mask;

			if (	!notification_name_regexp_.test( notifications[i].n ) ||
						notifications[i].trg.t !== 'sensor_value' || // skip not sensor_value notification type
						sName === '*' || // skip when sensor_name_mask is all
						!sName || // skip when sensor_name_mask is not set
						parseInt(notifications[i].trg.p.merge, 10) || // skip merge similar sensors notification
						notifications[i].trg.p.sensor_type	) { // skip when set sensor_type for notification
				continue;
			}

			nId = notifications[i].id;
			app.notifications.listById[ nId ] = notifications[i];

			for (j = 0, uIdsLength = notifications[i].un.length; j < uIdsLength; j++) {
				uId = notifications[i].un[j];

				!app.notifications.listByUIdSName[ uId ] && (app.notifications.listByUIdSName[ uId ] = {});
				app.notifications.listByUIdSName[ uId ][ sName ] = notifications[i];
			}
		}
	};

	/**
	 * Handler for resource event 'messageRegistered'
	 * @param  {object} event wialon event
	 */
	var messageRegisteredCallback_ = function messageRegisteredCallback_(event) {
		var
			t,
			resource = event.getTarget(),
			msg = event.getData(),
			valPos,
			notification,
			uId = parseInt(msg.unit, 10),
			sId,
			nsId,
			unitSensors,
			rowData;

		if (!resource || !msg || msg.tp !== 'unm' || !msg.t || !app.notifications.listById[ msg.nid ] || !msg.txt) {
			return;
		}

		valPos = msg.txt.indexOf(app.notifications.NOTIFICATION_TEXT_DELIMITER);

		if (valPos < 0) {
			return;
		}

		notification = app.notifications.listById[ msg.nid ];

		// Get notification sensor ID
		unitSensors = app.units.listById[ msg.unit ].getSensors();
		for (sId in unitSensors) {
			if (unitSensors[sId].n === notification.trg.p.sensor_name_mask) {
				nsId = parseInt( sId, 10);
			}
		}

		// Make flag for sensor red bordering
		if (!app.notifications.triggered[uId]) {
			app.notifications.triggered[uId] = {};
		}
		if (!app.notifications.triggered[uId][nsId]) {
			app.notifications.triggered[uId][nsId] = true;
			// On desktop
			if (app.units.watchSensors[uId][nsId].onDesktop) {
				app.$('#' + app.units.watchSensors[uId][nsId].usId).addClass(app.notifications.WARN_CLASS);
			}
			// On unit sensors window
			if (app.units.sensorsPanelUnit() && app.units.sensorsPanelUnit().getId() === uId) {
				app.$('#t' + app.units.watchSensors[uId][nsId].usId).closest('.caption').addClass(app.notifications.WARN_CLASS);
			}
		}

		// HACK: fetch number value & round it
		msg.txt = msg.txt.substr(valPos + 1);

		t = msg.txt.match(/^([0-9]+\.?[0-9]*)\s?(.*)/);
		if (t) {
			t[1] = Number(t[1]).toFixed(app.core.DEFAULT_FIXED_TO);
			t[1] % 1 === 0 &&
				(t[1] = parseInt(t[1], 10));
			msg.txt = t[1] + (t[2].length ? ' ' + t[2] : '');
		}

		rowData = {
			uId: uId,
			sId: nsId,
			time: msg.t,
			val: msg.txt
		};

		if (desktopDataTable_.fnSettings().fnRecordsTotal() >= DESKTOP_NOTIFICATIONS_LIMIT_) {
			// Delete the first row without redraw
			desktopDataTable_.fnDeleteRow(0, null, false);
		}
		else {
			// Increment counter
			app.notifications.unreadCount( app.notifications.unreadCount() + 1 );
		}

		// Add data without redraw
		desktopDataTable_.fnAddData([rowData], false);

		// Now redraw with throttling, don't hesitate to call it often
		desktopDataTableRedraw_();
	};

	// ***************************
	// Public Properties & Methods
	// ***************************

	app.notifications.WARN_CLASS = 'warn',

	// Does the user have access to view Notifications
	app.notifications.allowNotifications = false;

	app.notifications.resource = undefined;

	app.notifications.leftCount = ko.observable(-1);

	app.notifications.leftEmailsCount = ko.observable(-1);

	// Computed observable, defined later
	app.notifications.canCreate = undefined;

	// Created notifications only
	app.notifications.listById = {};
	// Created notifications + not created (without id property)
	app.notifications.listByUIdSName = {};

	app.notifications.triggered = {};

	app.notifications.showOnDesktop = ko.observable(false);

	// Observable setting to show on unit sensor info window
	app.notifications.observableSettings = {
		// if unit.userAccess has flag wialon.item.Unit.accessFlag.monitorState
		allowCreate: ko.observable(false),

		enabled: ko.observable(false),
		inside: ko.observable(false),
		lower_bound: ko.observable(false),
		upper_bound: ko.observable(false),

		phone: ko.observable(false),
		phoneCheckbox: ko.observable(false),

		email: ko.observable(false),
		emailCheckbox: ko.observable(false)
	};

	app.notifications.unreadCount = ko.observable(0); // observe only count for perfomance

	/**
	 * Init desktops DOM elements, called in core.startApp
	 * @return {void}
	 */
	app.notifications.initDOM = function initDOM() {
		var
			e;

		// Cache commonly used elements
		for (e in pendingCachingElements_) {
			$c_[e] = app.$( pendingCachingElements_[e] );
		}

		$c_.desktop_notifications.on('hidden.bs.dropdown', function(event) {
			app.notifications.showOnDesktop(false);
		});

		// Desktop notifications DataTable
		desktopDataTable_ = $c_.desktop_notifications_table.dataTable( {
			sScrollY: DESKTOP_NOTIFICATIONS_ROW_HEIGHT_,
			bAutoWidth: false, // Don't calculate auto width, we set it in aoColumns
			aaData: [],
			aaSorting: [[2, 'desc']], /* Initial sort */
			aoColumns: [
				{
					mData: 'uId',
					// sClass: 'n-uId',
					mRender: function(data, type, full) {
						return '<div class="n-uId" id="n-u-' + data + '">' + app.units.listById[data].getName() + '</div>';
					},
				},
				{
					mData: 'sId',
					// sClass: 'n-sId',
					mRender: function(data, type, full) {
						return '<div class="n-sId" id="n-us-' + app.units.watchSensors[full.uId][data].usId + '">' + app.units.sensorsInfo[full.uId][data].n + '</div>';
					}
				},
				{
					mData: 'time',
					// sClass: 'n-time',
					mRender: function(data, type, full) {
						return '<div class="n-time">' + app.wialon.util.DateTime.formatTime(data, 2, app.user.currentUserDateTimeFormat) + '</div>';
					}
				},
				{
					mData: 'val',
					// sClass: 'n-val',
					mRender: function(data, type, full) {
						return '<div class="n-val">' + ((data === app.wialon.item.MUnitSensor.invalidValue) ? app.lang.sensor.invalid_value : data ) + '</div>';
					}
				}
			],
			sDom: 'rtS',
			bDeferRender: true
		});

		// Click on desktop notifications popup cols
		$c_.desktop_notifications_table
			// .on(
			// 	{
			// 		'click.notification': function(event) {
			// 			var
			// 				uId = app.$(this).attr('id').split('-')[2];

			// 			app.units.focusOnUnit( app.units.listById[uId] );

			// 			event.preventDefault();
			// 		}
			// 	},
			// 	'td .n-uId'
			// )
			.on(
				{
					'click.notification': function(event) {
						var
							rowData = desktopDataTable_.fnGetData(this);

						app.units.sensorInfoShow( app.units.watchSensors[rowData.uId][rowData.sId], undefined, true );
						app.units.sensorInfoChangePeriod('today');

						event.preventDefault();
					}
				},
				'tr'
			);
	};

	/**
	 * Init handler on wialon loaded event
	 * called after user.initOnWialonLoaded
	 */
	app.notifications.initOnWialonLoaded = function initOnWialonLoaded() {
		var
			i,
			id,
			s,
			resource,
			resources,
			resI = false,
			resId = false,
			resourcesLength,
			currentUserId,
			lstByIdShortInfo,
			ids = [];

		s = app.wialon.core.Session.getInstance();

		resId = app.user.getNotificationsResourceId();

		if (resId) {
			resource = s.getItem(resId);
			if (resource && app.wialon.util.Number.and(resource.getUserAccess(), app.wialon.item.Resource.accessFlag.editNotifications)) {
				app.notifications.resource = resource;
			}
		}

		// If the user lost access to resource or first app init
		if (!app.notifications.resource) {
			currentUserId = app.user.currentUser.getId();
			resources = app.wialon.util.Helper.filterItems(s.getItems('avl_resource'), app.wialon.item.Resource.accessFlag.editNotifications);

			// First run: check creatorId
			for (i = 0, resourcesLength = resources.length; i < resourcesLength; i++) {
				if (resources[i].getCreatorId() === currentUserId) {
					resI = i;
					break;
				}
			}

			// Second run: get the first resource
			if (!resI && resourcesLength) {
				resI = 0;
			}

			if (resI !== false) {
				app.notifications.resource = resources[resI];
				app.user.setNotificationsResourceId( app.notifications.resource.getId() );
			}
		}

		if (app.notifications.resource) {
			s.updateDataFlags([
				{
					type: 'id', // type: id|type|col
					data: app.notifications.resource.getId(),
					flags: app.wialon.item.Item.dataFlag.messages,
					mode: 1 // mode: 0 – set, 1 – add, 2 – remove
				}
			]);

			app.notifications.resource.addListener('messageRegistered', messageRegisteredCallback_);

			lstByIdShortInfo = app.notifications.resource.getNotifications();
			for (id in lstByIdShortInfo) {
				parseInt(id, 10) && ids.push( parseInt(id, 10) );
			}
			app.notifications.resource.getNotificationsData( ids, getNotificationsDataCallback_ );

			// Check viewNotifications user access
			app.notifications.allowNotifications = lstByIdShortInfo && app.wialon.util.Number.and(app.notifications.resource.getUserAccess(), app.wialon.item.Resource.accessFlag.viewNotifications) ? true : false;

			// Add listeners
			app.notifications.resource.addListener(
				'updateNotification',
				function updateNotificationEventHandler(event){
					var
						notification = event.getData(),
						notificationOld = event.getOldData(),
						action = notification ? (notificationOld ? 'update' : 'create') : 'delete',
						nId = action === 'delete' ? notificationOld.id : notification.id,
						uId_sId,
						uId,
						sId,
						sName,
						currentSensor = app.units.currentSensor();

					if (app.notifications.listById[nId]) {
						if (action === 'delete') {
							if (app.notifications.listById[nId] && notification_name_regexp_.test( notificationOld.n)) {
								uId_sId = notificationOld.n.match(notification_name_regexp_);
								uId = parseInt( uId_sId[2], 10);
								sId = parseInt( uId_sId[3], 10);
								sName = app.units.watchSensors[uId][sId].name;

								app.notifications.listByUIdSName[uId] && app.notifications.listByUIdSName[uId][sName] && (delete app.notifications.listByUIdSName[uId][sName]);
								delete app.notifications.listById[nId];

								if (currentSensor && currentSensor.indicator.uId === uId && currentSensor.indicator.sId === sId) {
									app.notifications.updateObservables();
								}
							}
						}
						else if (action === 'update') {
							app.notifications.resource.getNotificationsData( [nId], function getNotificationsDataEventHandler(errorCode, notifications){
								getNotificationsDataCallback_(errorCode, notifications);
								app.notifications.updateObservables();
							});
						}
					}

					if (action === 'create' || action === 'delete') {
						app.notifications.updateLeftCount();
					}
				},
				app.notifications.resource);
			app.notifications.resource.addListener('changeUserAccess', app.notifications.updateLeftCount, app.notifications.resource);

			app.notifications.updateLeftCount();

			// Init computed observable to check availability of creation new notifications
			app.notifications.canCreate = ko.computed(function(){
				var
					currentSensor = app.units && app.units.currentSensor && app.units.currentSensor();

				if (!currentSensor || !parseInt(currentSensor.indicator.sId, 10) ||	app.notifications.leftCount() ||
						(
							app.notifications.listByUIdSName[ currentSensor.indicator.uId ] &&
							app.notifications.listByUIdSName[ currentSensor.indicator.uId ][ currentSensor.indicator.name ] &&
							app.notifications.listByUIdSName[ currentSensor.indicator.uId ][ currentSensor.indicator.name ].id
						)) {
					return true;
				}

				return false;
			});
		}
		else {
			// app.core.errorMessage(null, app.lang.errors.cant_find_resource_to_store_notifications);
			app.notifications.canCreate = function(){return false;};
		}
	};

	/**
	 * Update notifications service eft count & email_notification service left count
	 * @param  {?Function} callback function to run after left count update
	 */
	app.notifications.updateLeftCount = function updateLeftCount(callback){
		if (app.notifications.allowNotifications) {
			// Get notifications left count to use
			app.wialon.core.Session.getInstance().getAccountData(
				app.user.currentUser.getAccountId(),
				function getAccountDataCallback(errorCode, data){
					if (errorCode) {
						app.notifications.leftCount(0);
						app.notifications.leftEmailsCount(0);
						app.core.errorMessage(errorCode, app.lang.errors.cant_create_notification);
					}
					else {
						if (data && data.settings && data.settings.combined && data.settings.combined.services) {
							// Get notifications limit
							app.notifications.leftCount(
								data.settings.combined.services.notifications &&
								(data.settings.combined.services.notifications.maxUsage === -1 ? -1
									: (data.settings.combined.services.notifications.maxUsage > data.settings.combined.services.notifications.usage ?
										data.settings.combined.services.notifications.maxUsage - data.settings.combined.services.notifications.usage
										: 0)
								) || 0);

							// Get email_notification limit
							app.notifications.leftEmailsCount(
								data.settings.combined.services.email_notification &&
								(data.settings.combined.services.email_notification.maxUsage === -1 ? -1
									: (data.settings.combined.services.email_notification.maxUsage > data.settings.combined.services.email_notification.usage ?
										data.settings.combined.services.email_notification.maxUsage - data.settings.combined.services.email_notification.usage
										: 0)
								) || 0);
						}
						else {
							app.notifications.leftCount(0);
							app.notifications.leftEmailsCount(0);
						}
					}
					app.core.callCallback(callback);
				}
			);
		}
		else {
			app.notifications.leftCount(0);
			app.core.callCallback(callback);
		}
	};

	/**
	 * Update all observables settings by sensor notification new data
	 */
	app.notifications.updateObservables = function updateObservables() {
		var
			i,
			sensorNotification,
			email = false,
			phone = false;

		if (!app.notifications.allowNotifications) {
			return;
		}

		sensorNotification = getSensorNotification_();

		if (sensorNotification) {
			app.notifications.observableSettings.enabled( sensorNotification.fl === NOTIFICATION_OFF_STATE_ ? false : true );
			app.notifications.observableSettings.inside( sensorNotification.trg.p.type === NOTIFICATION_IN_RANGE_ ? true : false );
			app.notifications.observableSettings.lower_bound( sensorNotification.trg.p.lower_bound );
			app.notifications.observableSettings.upper_bound( sensorNotification.trg.p.upper_bound );

			// fetch notification emails & phones
			for (i = sensorNotification.act.length - 1; i > -1; i--) {
				if (sensorNotification.act[i].t === 'email') {
					email = sensorNotification.act[i].p.email_to;
				}
				else if (sensorNotification.act[i].t === 'sms') {
					phone = sensorNotification.act[i].p.phones;
				}
			}
			app.notifications.observableSettings.emailCheckbox( Boolean(email) );
			app.notifications.observableSettings.phoneCheckbox( Boolean(phone) );
			app.notifications.observableSettings.email( email || app.user.settings.notifications.email() );
			app.notifications.observableSettings.phone( phone || app.user.settings.notifications.phone() );

			!notification_update_allow_ && (notification_update_allow_ = true);
			app.notifications.observableSettings.allowCreate(true);
		}
		else {
			// app.core.errorMessage(null, 'Cant create notification');
			app.notifications.observableSettings.allowCreate(false);
		}
	};

	app.notifications.mergeActions = function mergeActions(currentActions) {
		var newActions = [];
		var defaultKeys = notification_default_actions_.map(function(actions) {
			return actions.t;
		});

		var currentActionsKeys = currentActions.map(function(actions) {
			return actions.t;
		});

		for (var i = 0; i < defaultKeys.length; i++) {
			var needKey = defaultKeys[i];
			var currentActionItem = null;
			var defaultActionItem = null;
			var currentActionIndex = currentActionsKeys.indexOf(needKey);
			var action = {};
			if (~currentActionIndex) {
				action = app.$.extend(true, action, notification_default_actions_[i], currentActions[currentActionIndex]);
			} else {
				action = app.$.extend(true, action, notification_default_actions_[i]);
			}

			newActions.push(action);
		}

		return newActions;
	}

	/**
	 * Update notification properties and save them to wialon
	 * TODO: don't update on FALSE values (for example when wialon not loaded)
	 */
	app.notifications.updateNotification = function updateNotification() {
		var
			i,
			currentSensor = app.units.currentSensor(),
			newAct = [],
			actionsToDelete = {},
			sensorNotification,
			sensorNotificationPrev = {};

		if (!app.notifications.allowNotifications) {
			return;
		}

		sensorNotification = getSensorNotification_();
		app.$.extend(true, sensorNotificationPrev, sensorNotification);

		if (sensorNotification && notification_update_allow_) {
			// sensorNotification.act = app.$.extend(true, [], notification_default_actions_, sensorNotification.act || []);
			sensorNotification.act = app.notifications.mergeActions(sensorNotification.act || []);
			for (i = 0; i < sensorNotification.act.length; i++) {
				if (sensorNotification.act[i].t === 'email') {
					if ( app.notifications.observableSettings.emailCheckbox() && app.notifications.observableSettings.email() ) {
						sensorNotification.act[i].p.email_to = app.notifications.observableSettings.email();
						sensorNotification.act[i].p.subj = sensorNotification.n;
					}
					else {
						app.notifications.observableSettings.email('');
						actionsToDelete[i] = true;
					}
				}
				else if (sensorNotification.act[i].t === 'sms') {
					if ( app.notifications.observableSettings.phoneCheckbox() && app.notifications.observableSettings.phone() ) {
						sensorNotification.act[i].p.phones = app.notifications.observableSettings.phone();
					}
					else {
						app.notifications.observableSettings.phone('');
						actionsToDelete[i] = true;
					}
				}
			}

			for (i = 0; i < sensorNotification.act.length; i++) {
				if (!actionsToDelete[i]) {
					newAct.push( sensorNotification.act[i] );
				}
			}
			sensorNotification.act = newAct;

			sensorNotification.fl = app.notifications.observableSettings.enabled() ? NOTIFICATION_ON_STATE_ : NOTIFICATION_OFF_STATE_;
			sensorNotification.trg.p.type = app.notifications.observableSettings.inside() ? NOTIFICATION_IN_RANGE_ : NOTIFICATION_OUT_OF_RANGE_;
			sensorNotification.trg.p.lower_bound = app.notifications.observableSettings.lower_bound();
			sensorNotification.trg.p.upper_bound = app.notifications.observableSettings.upper_bound();

			if ( !app._.isEqual(sensorNotification, sensorNotificationPrev) ) {
				if (sensorNotification.id) {
					// Created notification
					app.notifications.resource.updateNotification(sensorNotification);
				}
				else {
					// Not created notification
					createSensorNotification_(sensorNotification, null, function createSensorNotification_Error(){
						delete app.notifications.listByUIdSName[ currentSensor.indicator.uId ][ currentSensor.indicator.name ];
					});
				}
			}
		}

		return true;
	};

	/**
	 * Whether the currentSensors notification settings have been changed
	 * @return {boolean} true - settings changed, false - otherwise
	 */
	app.notifications.isSettingsChanged = function isSettingsChanged() {
		var
			i,
			res = false,
			sensorNotification,
			oldEmail = false,
			oldPhone = false;

		if (!app.notifications.allowNotifications) {
			return res;
		}

		sensorNotification = getSensorNotification_();

		if (!sensorNotification) {
			return res;
		}

		for (i = sensorNotification.act.length - 1; i > -1; i--) {
			if (sensorNotification.act[i].t === 'email') {
				oldEmail = sensorNotification.act[i].p.email_to;
			}
			else if (sensorNotification.act[i].t === 'sms') {
				oldPhone = sensorNotification.act[i].p.phones;
			}
		}

		if (
				(sensorNotification.fl === NOTIFICATION_ON_STATE_ ? true : false) !== app.notifications.observableSettings.enabled() ||
				(sensorNotification.trg.p.type === NOTIFICATION_IN_RANGE_ ? true : false) !== app.notifications.observableSettings.inside() ||
				Number(sensorNotification.trg.p.lower_bound) !== Number(app.notifications.observableSettings.lower_bound()) ||
				Number(sensorNotification.trg.p.upper_bound) !== Number(app.notifications.observableSettings.upper_bound()) ||
				Boolean(oldEmail) !== app.notifications.observableSettings.emailCheckbox() ||
				Boolean(oldPhone) !== app.notifications.observableSettings.phoneCheckbox() ||
				(oldEmail && oldEmail !== app.notifications.observableSettings.email()) ||
				(oldPhone && oldPhone !== app.notifications.observableSettings.phone())
			) {
			res = true;
		}

		return res;
	};

	/**
	 * Delete all notifications from wialon
	 */
	app.notifications.deleteAllNotifications = function deleteAllNotifications(callback) {
		var
			notificationId;

		if (!app.notifications.resource || !app.notifications.allowNotifications) {
			app.core.callCallback(callback);
			return;
		}

		app.wialon.core.Remote.getInstance().startBatch();

		for (notificationId in app.notifications.listById) {
			app.notifications.resource.deleteNotification(notificationId);
		}

		// app.wialon.core.Remote.getInstance().finishBatch(function(code, combinedCode){ // code is zero if no errors. combinedCode is zero if all combined requests where successfully
		app.wialon.core.Remote.getInstance().finishBatch(callback);
	};

	/**
	 * Show/Hide notifications window on desktop
	 */
	app.notifications.toggleOnDesktop = function toggleOnDesktop() {
		if ( !app.notifications.allowNotifications || app.notifications.showOnDesktop()  ) {
			return;
		}

		app.notifications.showOnDesktop(true);
	};

	/**
	 * Clear all notifications from desktop
	 */
	app.notifications.clearAllFromDesktop = function clearAllFromDesktop() {
		var
			uId,
			sId;
		desktopDataTable_.fnClearTable();
		desktopDataTable_.fnSettings().oScroll.sY = DESKTOP_NOTIFICATIONS_ROW_HEIGHT_;
		app.notifications.unreadCount(0);
		$c_.desktop_notifications.removeClass('open');

		// Remove warn class from widgets
		for (uId in app.notifications.triggered) {
			for (sId in app.notifications.triggered[uId]) {
				app.$('#' + app.units.watchSensors[uId][sId].usId).removeClass(app.notifications.WARN_CLASS);
			}
		}
		app.notifications.triggered = {};
	};

	return app;
})(sensolator || {});

// Units module
var sensolator = (function(app){
    'use strict';

    app.units = app.units || {};

    // ****************************
    // Private Properties & Methods
    // ****************************
    var
        pendingCachingElements_ = {
            units_holder: '#units',

            unit_sensors: '#unit_sensors',

            sensor_props: '#sensor_props',
            sensor_props_label: '#sensor_props_label',
            sensor_props_bg_image: '#sensor_prop_bg_image',

            sensor_info_modal: '#sensor_info',
            sensor_info_label: '#sensor_info_label',
            sensor_info_current_skin: '#sensor_current_skin',
            sensor_info_log_table: '#sensor_info_log_table',

            sensor_skin_defaults: '#sensor_skin_defaults',
            unit_commands: '#unit_commands',
            unit_changed_params: '#unit-commands-param'
        },

        // DOM Constants
        UNITS_HOLDER = '#units',
        SENSOR_INFO_GRAPH_ = '#sensor_info_graph',
        SENSOR_INFO_NOTIFICATIONS_ = '#sensor_info_notifications',
        SENSOR_INFO_NOTIFICATIONS_HOLDER_ = '#sensor_info_notifications_holder',

        GRIDSTER_ELEMENT_TMPL_ = '#grid_elem_tmpl',

        INDICATOR_CLASS_ = 'indicator',

        // General Constants
        DEFAULT_SENSOR_SKIN_ = 'text_simple',
        DEFAULT_SENSOR_MIN_ = 0,
        DEFAULT_SENSOR_MAX_ = 100,
        DEFAULT_SENSOR_FIT_ = true,
        DEFAULT_SENSOR_SHOW_UNIT_NAME_ = true,
        DEFAULT_SENSOR_SHOW_SENSOR_NAME_ = false,
        DEFAULT_SENSOR_SHOW_AXES_ = true,
        DEFAULT_SENSOR_ROUND_VALUE_ = false,
        DEFAULT_SENSOR_COLOR_1_ = '#fb0004',
        DEFAULT_SENSOR_COLOR_2_ = '#f0a116',
        DEFAULT_SENSOR_COLOR_3_ = '#96c22b',
        DEFAULT_SENSOR_SCHEME_ = [],
        DEFAULT_SENSOR_SCHEME_1_ = [ {
            color: '#96c22b',
            value: 25
        }, {
            color: '#f0a116',
            value: 75
        }, {
            color: '#fb0004'
        } ],
        DEFAULT_SENSOR_SCHEME_2_ = [ {
            color: '#f0a116',
            value: 50
        },{
            color: '#fb0004'
        } ],
        DEFAULT_SENSOR_SCHEME_3_ = [ {
            color: '#96c22b',
            value: 36
        }, {
            color: '#f0a116',
            value: 80
        }, {
            color: '#fb0004'
        } ],
        // Only for app.units.sensorWindowUpdatePreviewThrottled
        SENSOR_PREVIEW_UPDATE_THROTTLE_TIME_ = 1000,

        UNIT_COUNTERS_ = ['EngineHours', 'Mileage', 'Traffic'],

        /**
         * Sensor default visual settings for sensor types
         * @type {Object}
         */
        sensorDefaultsByType_ = {},

        // Cached DOM elements, initialized from pendingCachingElements_ in units.initDOM()
        $c_ = {},

        // Initialized in units.initDOM()
        widgetTmpl_,

        widgetGeneralDefaults_ = {
            sizex: 12,
            sizey: 12,
            // row: 1,
            // col: 4,
            controls: [
                'delete',
                'options',
                'info',
                'unitSensors',
                'commands'
            ]
        },
        widgetDefaults_ = {
            text_simple: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 6
            }),
            text_simple_color: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 6
            }),
            text_simple_custom: $.extend({}, widgetGeneralDefaults_, {
                sizex: 7,
                sizey: 6
            }),
            text_circle_gradient: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 12
            }),
            horizontal_simple: $.extend({}, widgetGeneralDefaults_, {
                sizex: 36,
                sizey: 6
            }),
            gauge_circle: $.extend({}, widgetGeneralDefaults_),
            gauge_quartercircle: $.extend({}, widgetGeneralDefaults_),
            gauge_semicircle: $.extend({}, widgetGeneralDefaults_, {
                sizex: 24,
                sizey: 12
            }),
            gauge_circle2: $.extend({}, widgetGeneralDefaults_),
            color_dots: $.extend({}, widgetGeneralDefaults_, {
                sizex: 18,
                sizey: 6
            }),
            horizontal_bar: $.extend({}, widgetGeneralDefaults_, {
                sizex: 18,
                sizey: 6
            }),
            horizontal_bar_gradient1: $.extend({}, widgetGeneralDefaults_, {
                sizex: 18,
                sizey: 6
            }),
            horizontal_bar_gradient2: $.extend({}, widgetGeneralDefaults_, {
                sizex: 18,
                sizey: 6
            }),
            horizontal_bar_mark: $.extend({}, widgetGeneralDefaults_, {
                sizex: 18,
                sizey: 6
            }),
            vertical_bar_mark: $.extend({}, widgetGeneralDefaults_, {
                sizex: 18,
                sizey: 6
            }),
            switch1: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 6
            }),
            switch2: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 6
            }),
            switch3: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 6
            }),
            switch4: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 6
            }),
            switch5: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 12
            }),
            switch6: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 12
            }),
            graph_simple: $.extend({}, widgetGeneralDefaults_, {
                sizex: 24,
                sizey: 12
            }),
            graph_simple2: $.extend({}, widgetGeneralDefaults_, {
                sizex: 24,
                sizey: 12
            }),
            graph_simple3: $.extend({}, widgetGeneralDefaults_, {
                sizex: 24,
                sizey: 12
            }),
            graph_simple4: $.extend({}, widgetGeneralDefaults_, {
                sizex: 24,
                sizey: 12
            }),
            graph_simple5: $.extend({}, widgetGeneralDefaults_, {
                sizex: 24,
                sizey: 12
            }),
            graph_simple6: $.extend({}, widgetGeneralDefaults_, {
                sizex: 12,
                sizey: 12
            })
        },
        sensorInfoLogTable_ = false;

    app.units.defaultSensor = {
        // General Constants
        DEFAULT_SENSOR_SKIN_ : DEFAULT_SENSOR_SKIN_,
        DEFAULT_SENSOR_MIN_ : DEFAULT_SENSOR_MIN_,
        DEFAULT_SENSOR_MAX_ : DEFAULT_SENSOR_MAX_,
        DEFAULT_SENSOR_FIT_ : DEFAULT_SENSOR_FIT_,
        DEFAULT_SENSOR_SHOW_UNIT_NAME_ : DEFAULT_SENSOR_SHOW_UNIT_NAME_,
        DEFAULT_SENSOR_SHOW_SENSOR_NAME_ : DEFAULT_SENSOR_SHOW_SENSOR_NAME_,
        DEFAULT_SENSOR_SHOW_AXES_ : DEFAULT_SENSOR_SHOW_AXES_,
        DEFAULT_SENSOR_ROUND_VALUE_ : DEFAULT_SENSOR_ROUND_VALUE_,
        DEFAULT_SENSOR_COLOR_1_ : DEFAULT_SENSOR_COLOR_1_,
        DEFAULT_SENSOR_COLOR_2_ : DEFAULT_SENSOR_COLOR_2_,
        DEFAULT_SENSOR_COLOR_3_ : DEFAULT_SENSOR_COLOR_3_,
        DEFAULT_SENSOR_SCHEME_: DEFAULT_SENSOR_SCHEME_
    };

    var unitsHolderOverflowFix_ = function unitsHolderOverflowFix_(event){
        // if ($c_.units_holder[0].scrollHeight > $c_.units_holder[0].clientHeight) {
        //  $c_.units_holder.css('pointer-events', 'auto');
        // }
        // else {
        //  $c_.units_holder.css('pointer-events', 'none');
        // }
    };

    var isloadUnitsCompleted_ = false;
    var onLoadUnitsComplete_ = function onLoadUnitsComplete_(){
        app.desktops.changeDesktopTo( app.desktops.currentId(), true );

        unitsHolderOverflowFix_();

        // Open user settings if they not provided, after page & wialon loads
        if ( !app.user.settings.notifications.email() && !app.user.settings.notifications.phone() && app.units.list().length ) {
            app.user.showUserSettingsWindow();
        }

        isloadUnitsCompleted_ = true;
    };

    /**
     * Load units & assing unit event listeners
     * @private
     * @param  {Function} callback [description]
     */
    var loadUnits_ = function loadUnits_(callback) {
        var
            i,
            j,
            uId,
            list = app.wialon.core.Session.getInstance().getItems('avl_unit'),
            listWithSensors = [];

        if (!list || !list.length) {
            // app.core.errorMessage(null, app.lang.warnings.no_units);
            ko.applyBindings(sensolator);
            onLoadUnitsComplete_();
        }
        else {
            // Sort units by name in ascending order
            list.sort(function(unit1,unit2){
                if ( unit1.getName().toLowerCase() > unit2.getName().toLowerCase() ) {
                    return 1;
                }
                return -1;
            });

            var changePositionHandler = function(){
                if (app.desktops.current().background.type() === 'map') {
                    app.map.moveUnitMarker(this);
                }
            };

            for (i in list) {
                // list[i].showOnMap = ko.observable(true);

                // Don't show units with no sensors
                // if ( !app._.keys( list[i].getSensors() ).length  ) {
                //  continue;
                // }

                listWithSensors.push( list[i] );

                uId = list[i].getId();

                if ( !app.units.watchSensors[uId] ) {
                    app.units.watchSensors[uId] = {};
                }

                list[i].customFields = ko.observableArray([]);
                list[i].customFieldsShowRestore = ko.observable(false);

                list[i].addListener('changeMessageParams', updateWatchSensors_, list[i]);
                list[i].addListener('changeLastMessage', updateWatchSensors_, list[i]);
                list[i].addListener('updateSensor', updateWatchSensors_, list[i]);
                list[i].addListener('changePosition', changePositionHandler, list[i]);

                // change counters listeners
                for (j = UNIT_COUNTERS_.length - 1; j > -1; j--) {
                    list[i].addListener('change' + UNIT_COUNTERS_[j] + 'Counter', updateWatchCounter_, list[i]);
                }

                // User access for unit
                list[i].userAccess = ko.observable( list[i].getUserAccess() );
                list[i].addListener('changeUserAccess', function(event){
                    this.userAccess(event.getData());
                }, list[i]);

                app.units.listById[ uId ] = list[i];
            }
            app.units.list = ko.observableArray(listWithSensors);
            onLoadUnitsComplete_();

            ko.applyBindings(sensolator);

            // Sensor props popup
            $c_.sensor_skin_defaults.find('div.' + INDICATOR_CLASS_).each(function(index, item){
                var
                    $item = app.$(item),
                    skin = $item.attr('id');

                $item.indicator({skin: skin});
            });
        }
    };

    /**
     * Apply sensor default skin & settings for all sensors on all desktops with the same sensor type
     * @private
     * @param  {array} types  Only for selected types; default: apply on all types
     */
    var applySensorDefaults_ = function applySensorDefaults_(types) {
        var
            i,
            desktopId,
            uId,
            sId,
            sensor,
            typesLength,
            typesObj = {
                watchCounters: {},
                watchSensors: {}
            },
            watchItems;

        !types && ( types = app._(sensorDefaultsByType_).keys() );

        typesLength = types.length;

        if (typesLength) {
            for (i = 0; i < typesLength; i++) {
                if (UNIT_COUNTERS_.indexOf(types[i]) > -1) {
                    typesObj.watchCounters[ types[i] ] = sensorDefaultsByType_[ types[i] ];
                }
                else {
                    typesObj.watchSensors[ types[i] ] = sensorDefaultsByType_[ types[i] ];
                }
            }

            for (i in typesObj) {
                if ( app._(typesObj[i]).keys().length ) {
                    for (desktopId in app.desktops.listById) {
                        watchItems = app.desktops.listById[desktopId][i];
                        for (uId in watchItems) {
                            for (sId in watchItems[uId]) {
                                sensor = watchItems[uId][sId];
                                if ( typesObj[i][sensor.type] ) {
                                    app.utils.extendKo(sensor.indicator, typesObj[i][sensor.type]);
                                    app.utils.extendKo(sensor.updatedIndicator, typesObj[i][sensor.type]);
                                }
                            }
                        }
                    }
                }
            }

            app._.keys(typesObj.watchCounters).length && redrawWatchCounters_();
            app._.keys(typesObj.watchSensors).length && app.units.recalcAllUnits();
        }
    };

    /**
     * Create gridster widget for unit sensor
     * @param  {object} data        unit sensor data
     * @param  {object} widgetProps gridster props
     */
    var createWidget_ = function createWidget_(data, widgetProps, fade_speed) {
        if(app.user.settings.version === 1 && widgetProps){
            widgetProps.sizex = Math.floor(widgetProps.sizex*1*96/16);
            widgetProps.sizey = Math.floor(widgetProps.sizey*1*96/16);

            widgetProps.col = Math.floor(Math.abs(widgetProps.col*1)*96/16);
            widgetProps.row = Math.floor(Math.abs(widgetProps.row)*1*96/16);
        }

        if (!data.indicator.sId || !data.indicator.uId) {
            data.onDesktop = false;
            return;
        }

        var
            $widget = app.$( widgetTmpl_(data) ),
            props = app.$.extend(true, {}, widgetDefaults_[data.indicator.skin], widgetProps || {});

        // Add warn class if notification on that sensor is triggered
        if (app.notifications.triggered[data.indicator.uId] && app.notifications.triggered[data.indicator.uId][data.indicator.sId]) {
            $widget.addClass(app.notifications.WARN_CLASS);
        }

        // Add indicator
        $widget.indicator( data.indicator );

        app.gridster.add_widget.apply(
            app.gridster,
            [
                $widget,
                props.sizex,
                props.sizey,
                props.col,
                props.row,
                undefined,
                props.controls
            ],
            fade_speed || 2000
        );

        if(props.sizey*1 > 3 && props.sizex*1 > 6){
            $widget.removeClass('hide-ctrl');
        }else{
            $widget.addClass('hide-ctrl');
        }
    };

    /**
     * Main update unit sensors callback for Desktop && Unit Sensors popup
     * @private
     * @param  {integer} code      ErrorCode
     * @param  {[type]} sensors   [description]
     * @param  {[type]} unit      [description]
     * @param  {unixtime} eventTime [description]
     * @return {boolean}          true on success, false on error
     */
    var updateWatchSensorsCallback_ = function updateWatchSensorsCallback_(code, sensors, unit, eventTime) {
        var
            i,
            j,
            printTime = app.wialon.util.DateTime.formatTime(eventTime, 2, app.user.currentUserDateTimeFormat),
            typeDefaults,
            desktopId = app.desktops.currentId(),
            unitId = unit.getId(),
            watchSensors, // local variable, do not remove this from var
            sensor,
            sensorHistory,
            //sensorNotifications,
            sensorsInfo = unit.getSensors(),
            sensorId,
            newValue,
            sensorsPanelUnit = app.units.sensorsPanelUnit() && (app.units.sensorsPanelUnit().getId() === unit.getId()),
            currentSensor = app.units.currentSensor(),
            indicatorOptions,

            newSensorIds = [], // sensors that haven't been initialized
            oldSensorIds = [], // sensors that have been initialized
            toDeleteSensorIds = [];

        app.units.sensorsInfo[unitId] = sensorsInfo;

        if (code) {
            app.core.errorMessage(code, app.lang.errors.performing_request);
            return false;
        }

        // Update history
        for (sensorId in sensors) {
            sensors[sensorId] !== app.wialon.item.MUnitSensor.invalidValue &&
                (sensors[sensorId] = sensors[sensorId] % 1 ? Number((+sensors[sensorId]).toFixed(app.core.DEFAULT_FIXED_TO)) : sensors[sensorId]);
            sensorHistory = app.history.getHistoryObject(unitId, sensorId);
            sensorHistory.addItem(sensors[sensorId], eventTime);

            // sensorNotifications = app.notifications.getNotificationsObject(unitId, sensorId);
            // sensorNotifications.check(sensors[sensorId], eventTime);
        }
        sensorHistory = undefined;

        watchSensors = app.desktops.listById[ desktopId ].watchSensors;
        !watchSensors[unitId] && (watchSensors[unitId] = {});

        // Delete from Current desktop not existed sensors
        for (sensorId in watchSensors[unitId]) {
            if ( !sensorsInfo[sensorId] ) {
                toDeleteSensorIds.push(sensorId);
            }
        }

        // Separate new & old sensors
        for (sensorId in sensors) {
            if ( !watchSensors[unitId][sensorId] || !watchSensors[unitId][sensorId].usId || !ko.isObservable(watchSensors[unitId][sensorId].val ) ) {
                newSensorIds.push(sensorId);
            }
            else {
                oldSensorIds.push(sensorId);
            }
        }
        //
        // Iterate through desktop
        //

        // Delete not existed sensors
        for (i in toDeleteSensorIds) {
            sensorId = toDeleteSensorIds[i];
            app.units.removeWatchItem(unitId, sensorId);
            delete watchSensors[unitId][sensorId];
        }

        // Add new sensors
        for (i in newSensorIds) {
            sensorId = newSensorIds[i];
            sensorHistory = app.history.getHistoryObject(unitId, sensorId);
            newValue = sensorHistory.getLast(unitId, sensorId);

            // Not created on this desktop or not fully initialized
            watchSensors[unitId][sensorId] = app.utils.extendKo({
                    usId: unitId + '_' + sensorId, // unitId + sensorId

                    indicator: {
                        sId: sensorId, // sensor ID
                        uId: unitId, // unit ID
                        skin: DEFAULT_SENSOR_SKIN_,
                        min: DEFAULT_SENSOR_MIN_,
                        max: DEFAULT_SENSOR_MAX_,
                        fit: DEFAULT_SENSOR_FIT_,
                        val: sensors[sensorId],
                        valid: newValue.isValid,
                        name: sensorsInfo[sensorId].n,
                        metrics: sensorsInfo[sensorId].m,
                        show_unit_name: DEFAULT_SENSOR_SHOW_UNIT_NAME_,
                        show_sensor_name: DEFAULT_SENSOR_SHOW_SENSOR_NAME_,
                        show_axes: DEFAULT_SENSOR_SHOW_AXES_,
                        round: DEFAULT_SENSOR_ROUND_VALUE_,
                        bg_image: '',
                        color_1: DEFAULT_SENSOR_COLOR_1_,
                        color_2: DEFAULT_SENSOR_COLOR_2_,
                        color_3: DEFAULT_SENSOR_COLOR_3_,
                        scheme: DEFAULT_SENSOR_SCHEME_
                    },
                    updatedIndicator: {
                        skin: ko.observable( DEFAULT_SENSOR_SKIN_ ),
                        min: ko.observable( DEFAULT_SENSOR_MIN_ ),
                        max: ko.observable( DEFAULT_SENSOR_MAX_ ),
                        fit: ko.observable( DEFAULT_SENSOR_FIT_ ),
                        show_unit_name: ko.observable( DEFAULT_SENSOR_SHOW_UNIT_NAME_ ),
                        show_sensor_name: ko.observable( DEFAULT_SENSOR_SHOW_SENSOR_NAME_ ),
                        show_axes: ko.observable( DEFAULT_SENSOR_SHOW_AXES_ ),
                        round: ko.observable( DEFAULT_SENSOR_ROUND_VALUE_ ),
                        bg_image: ko.observable(''),
                        color_1: ko.observable( DEFAULT_SENSOR_COLOR_1_ ),
                        color_2: ko.observable( DEFAULT_SENSOR_COLOR_2_ ),
                        color_3: ko.observable( DEFAULT_SENSOR_COLOR_3_ ),
                        scheme: ko.observableArray( DEFAULT_SENSOR_SCHEME_ )
                    },

                    type: sensorsInfo[sensorId].t,
                    name: sensorsInfo[sensorId].n,

                    // TODO: check val && valid, and delete if no need
                    val: ko.observable(sensors[sensorId]),
                    valid: ko.observable(newValue.isValid),
                    time: ko.observable(printTime),

                    onDesktop: false,
                    updatedOnDesktop: ko.observable( watchSensors[unitId][sensorId] ? watchSensors[unitId][sensorId].onDesktop : false ),

                    period: ko.observable(false),
                    history: app.history.getHistoryObject(unitId, sensorId),
                    // notifications: app.notifications.getNotificationsObject(unitId, sensorId),

                    // gridster props
                    gridster: app.$.extend(true, {}, widgetDefaults_[DEFAULT_SENSOR_SKIN_] )
                },
                watchSensors[unitId][sensorId] || {}
            );

            var data = watchSensors[unitId][sensorId].indicator;
            if ( !data.scheme.length ) {
                var
                    skin = ~['gauge_circle2', 'gauge_semicircle', 'gauge_quartercircle'].indexOf(data.skin) ? data.skin : 'gauge_circle2',
                    typeScheme = getTypeScheme(skin),
                    scheme = typeScheme[1];
                _.forEach(scheme, function(v, i) {
                    scheme[i] = {
                        color: data['color_' + ((!typeScheme[0] ? 2 : 3) - i)] || v.color
                    };
                    if ( v.value ) {
                        scheme[i].value = v.value;
                    }
                });
                scheme = convertSchemeValues(scheme, [0, 100], [data.min, data.max]);
                watchSensors[unitId][sensorId].indicator.scheme = scheme;
                watchSensors[unitId][sensorId].updatedIndicator.scheme(_.map(scheme, _.clone));
                data = null;
            }

            if (sensorDefaultsByType_[sensorsInfo[sensorId].t]) {
                app.utils.extendKo(watchSensors[unitId][sensorId].indicator, sensorDefaultsByType_[sensorsInfo[sensorId].t]);
            }
            app.utils.extendKo(watchSensors[unitId][sensorId].updatedIndicator, watchSensors[unitId][sensorId].indicator);
            watchSensors[unitId][sensorId].onDesktop && watchSensors[unitId][sensorId].updatedOnDesktop(true);

            // Apply defaults for sensor type if defaults exist
            typeDefaults = sensorDefaultsByType_[ watchSensors[unitId][sensorId].type ];
            if ( typeDefaults ) {
                app.$.extend(true, watchSensors[unitId][sensorId].indicator, typeDefaults);
                for (j in typeDefaults) {
                    // TODO: check not created updatedIndicator fields
                    watchSensors[unitId][sensorId].updatedIndicator[j]( typeDefaults[j] );
                }
            }
        }

        // Update all old sensors values
        for (i in oldSensorIds) {
            sensorId = oldSensorIds[i];
            newValue = watchSensors[unitId][sensorId].history.getLast();

            watchSensors[unitId][sensorId].indicator.val = newValue.val;
            watchSensors[unitId][sensorId].indicator.valid = newValue.isValid;
            watchSensors[unitId][sensorId].indicator.metrics = sensorsInfo[sensorId].m;
        }

        // If opened Unit sensor props popup
        if (currentSensor && currentSensor.indicator.uId === unitId && Number(currentSensor.indicator.sId)) {
            newValue = currentSensor.history.getLast();
            currentSensor.val( sensorInfoGetValueToPrint_(currentSensor) );
            currentSensor.time(printTime);
            // If opened sensor info popup && monitoring today
            if ( app.units.sensorInfoGraph && currentSensor.period() === 'today' && !currentSensor.history.periodOffset && newValue.isValid) {
                if (app.units.sensorInfoGraph.series[0].data.length >= app.history.getMaxDataPoints()) {
                    app.units.sensorInfoGraph.series[0].data.shift();
                }
                app.units.sensorInfoGraph.series[0].data.push(
                    {
                        x: newValue.time,
                        y: newValue.val
                    }
                );
                app.units.sensorInfoGraph.update();
            }
            // If sensor props popup
            else {
                // currentSensor.val = watchSensors[unitId][currentSensor.sId].indicator.val;
                indicatorOptions = app.$.extend(true, {}, currentSensor.indicator);
                for (i in currentSensor.updatedIndicator) {
                    if ( ko.isObservable(currentSensor.updatedIndicator[i]) ) {
                        indicatorOptions[i] = currentSensor.updatedIndicator[i]();
                    }
                }
                $c_.sensor_info_current_skin.indicator( indicatorOptions );
            }
        }

        // If Opened Unit sensors popup
        if (sensorsPanelUnit) {
            // Delete from Unit Sensors popup not existed sensors
            app.units.sensorsPanelData.remove(function(sensor) {
                return !watchSensors[unitId][ sensor.indicator.sId ];
            });
        }

        var elem;

        // Update Gridster widgets on desktop
        if ( isloadUnitsCompleted_ ) {
            for (sensorId in sensors) {
                if ( watchSensors[unitId][sensorId].onDesktop ) {
                    // Redraw current desktop widgets
                    elem = app.core.$c.grid_cont.find('#' + watchSensors[unitId][sensorId].usId);
                    if (elem.length) {
                        elem.indicator( watchSensors[unitId][sensorId].indicator );
                    }
                    else {

                    }
                }
            }
        }

        // If Opened Unit sensors popup
        if (sensorsPanelUnit) {
            for (i in newSensorIds) {
                app.units.sensorsPanelData.push( watchSensors[unitId][ newSensorIds[i] ] );
            }

            for (i in app.units.sensorsPanelData()) {
                sensor = app.units.sensorsPanelData()[i];
                // Redraw Unit Sensors popup widgets
                elem = app.$('#t' + sensor.usId);

                newValue = sensor.history.getLast();

                app.units.sensorsPanelData()[i].val( sensorInfoGetValueToPrint_(sensor) );
                app.units.sensorsPanelData()[i].valid( newValue.isValid );

                if (elem.length) {
                    elem.indicator( app.units.sensorsPanelData()[i].indicator );
                }
                else {
                    console.log('Can\'t find unit sensors popup widget to update sensor value');
                }
            }
        }
    };

    /**
     * Event handler for update everty counter
     * @param  {object} event Event data object
     */
    var updateWatchCounter_ = function updateWatchCounter_(event) {
        var
            uId = event.getTarget().getId(),
            type = event.getType().match(/^change(.*)Counter$/)[1],
            counter = app.units.watchCounters[uId][type],
            elem,
            val = event.getData(),
            time = Math.round(event.getTimeStamp() / 1000);

        counter.history.addItem(val, time);
        counter.val(val);
        counter.indicator.val = val;

        if (counter.onDesktop) {
            elem = app.core.$c.grid_cont.find('#' + counter.usId);
            elem.indicator( counter.indicator );
        }

        // Update graph
        if ( app.units.sensorInfoGraph && app.units.currentSensor().usId === counter.usId) {
            if (app.units.sensorInfoGraph.series[0].data.length >= app.history.getMaxDataPoints()) {
                app.units.sensorInfoGraph.series[0].data.shift();
            }
            app.units.sensorInfoGraph.series[0].data.push(
                {
                    x: time,
                    y: val
                }
            );
            app.units.sensorInfoGraph.update();
        }
    };

    /**
     * Update all watchCounters on current desktop
     * @param  {(number|array)} unitId UnitId(s) of units to update their counters
     * @param  {?array} types  array of counter types to update, default - all types
     */
    var updateWatchCounters_ = function updateWatchCounters_(unitId, types) {
        var
            i,
            j,
            l,
            unit,
            uId,
            uIds = unitId ? [unitId] : app._.keys(app.units.listById),
            type,
            metrics = app._(app.lang.measure_units).clone();

        if (!types) {
            types = UNIT_COUNTERS_;
        }
        else if (!app.$.isArray(types)) {
            types = [types];
        }

        for (i = 0, l = uIds.length; i < l; i++) {
            uId = uIds[i];
            unit = app.units.listById[uId];
            metrics['Mileage'] = app.lang.measure_units['Mileage'][unit.getMeasureUnits()];
            for (j = types.length - 1; j > -1; j--) {
                type = types[j];
                if (!app.units.watchCounters[uId]) app.units.watchCounters[uId] = {};
                if (!app.units.watchCounters[uId][type]) app.units.watchCounters[uId][type] = {};
                // Counters not fully initialized
                if (!app.units.watchCounters[uId][type].usId || !ko.isObservable(app.units.watchCounters[uId][type].val)) {
                    app.units.watchCounters[uId][type] = app.utils.extendKo(
                        {
                            onDesktop: false,
                            updatedOnDesktop: ko.observable(false),
                            usId: uId + '_' + type,
                            name: app.lang.counters[type],
                            indicator: {
                                sId: type, // sensor ID
                                uId: uId, // unit ID
                                skin: DEFAULT_SENSOR_SKIN_,
                                min: DEFAULT_SENSOR_MIN_,
                                max: DEFAULT_SENSOR_MAX_,
                                fit: DEFAULT_SENSOR_FIT_,
                                // valid: newValue.isValid,
                                name: app.lang.counters[type],
                                metrics: metrics[type],
                                show_unit_name: DEFAULT_SENSOR_SHOW_UNIT_NAME_,
                                show_sensor_name: DEFAULT_SENSOR_SHOW_SENSOR_NAME_,
                                show_axes: DEFAULT_SENSOR_SHOW_AXES_,
                                round: DEFAULT_SENSOR_ROUND_VALUE_,
                                bg_image: '',
                                color_1: DEFAULT_SENSOR_COLOR_1_,
                                color_2: DEFAULT_SENSOR_COLOR_2_,
                                color_3: DEFAULT_SENSOR_COLOR_3_,
                                scheme: DEFAULT_SENSOR_SCHEME_
                            },
                            updatedIndicator: {
                                skin: ko.observable( DEFAULT_SENSOR_SKIN_ ),
                                min: ko.observable( DEFAULT_SENSOR_MIN_ ),
                                max: ko.observable( DEFAULT_SENSOR_MAX_ ),
                                fit: ko.observable( DEFAULT_SENSOR_FIT_ ),
                                show_unit_name: ko.observable( DEFAULT_SENSOR_SHOW_UNIT_NAME_ ),
                                show_sensor_name: ko.observable( DEFAULT_SENSOR_SHOW_SENSOR_NAME_ ),
                                show_axes: ko.observable( DEFAULT_SENSOR_SHOW_AXES_ ),
                                round: ko.observable( DEFAULT_SENSOR_ROUND_VALUE_ ),
                                bg_image: ko.observable(''),
                                color_1: ko.observable( DEFAULT_SENSOR_COLOR_1_ ),
                                color_2: ko.observable( DEFAULT_SENSOR_COLOR_2_ ),
                                color_3: ko.observable( DEFAULT_SENSOR_COLOR_3_ ),
                                scheme: ko.observableArray( DEFAULT_SENSOR_SCHEME_ )
                            },
                            type: type,
                            period: ko.observable(false),
                            val: ko.observable(false),
                            valid: function(){return true;},
                            time: ko.observable(app.wialon.core.Session.getInstance().getServerTime()),
                            history: app.history.getHistoryObject(uId, type)
                        },
                        app.units.watchCounters[uId][type] || {}
                    );

                    var data = app.units.watchCounters[uId][type].indicator;
                    if ( !data.scheme.length ) {
                        var
                            skin = ~['gauge_circle2', 'gauge_semicircle', 'gauge_quartercircle'].indexOf(data.skin) ? data.skin : 'gauge_circle2',
                            typeScheme = getTypeScheme(skin),
                            scheme = typeScheme[1];
                        _.forEach(scheme, function(v, i) {
                            scheme[i] = {
                                color: data['color_' + ((!typeScheme[0] ? 2 : 3) - i)] || v.color
                            };
                            if ( v.value ) {
                                scheme[i].value = v.value;
                            }
                        });
                        scheme = convertSchemeValues(scheme, [0, 100], [data.min, data.max]);
                        app.units.watchCounters[uId][type].indicator.scheme = scheme;
                        app.units.watchCounters[uId][type].updatedIndicator.scheme(_.map(scheme, _.clone));
                        data = null;
                    }

                    if (sensorDefaultsByType_[type]) {
                        app.utils.extendKo(app.units.watchCounters[uId][type].indicator, sensorDefaultsByType_[type]);
                    }
                    app.utils.extendKo(app.units.watchCounters[uId][type].updatedIndicator, app.units.watchCounters[uId][type].indicator);
                    app.units.watchCounters[uId][type].onDesktop && app.units.watchCounters[uId][type].updatedOnDesktop(true);
                }
            }

            for (j = types.length - 1; j > -1; j--) {
                type = types[j];
                if (!app.units.watchCounters[uId][type]) app.units.watchCounters[uId][type] = {};
                app.units.watchCounters[uId][type].indicator.val = unit['get' + type + 'Counter']();
                app.units.watchCounters[uId][type].val(app.units.watchCounters[uId][type].indicator.val);
                app.units.watchCounters[uId][type].history.addItem(app.units.watchCounters[uId][type].val(), app.units.watchCounters[uId][type].time());
            }
        }
    };

    /**
     * Redraw all watchCounters which are on current desktop
     */
    var redrawWatchCounters_ = function redrawWatchCounters_() {
        var
            uId,
            sId,
            counter,
            elem;

        for (uId in app.units.watchCounters) {
            for (sId in app.units.watchCounters[uId]) {
                counter = app.units.watchCounters[uId][sId];
                if (counter.onDesktop) {
                    elem = app.core.$c.grid_cont.find('#' + counter.usId);
                    if (elem.length) {
                        elem.indicator( counter.indicator );
                    }
                }
            }
        }
    };

    /**
     * Handler for update watch sensors
     * @param  {[type]} event [description]
     * @return {[type]}       [description]
     * @this {unit}
     */
    var updateWatchSensors_ = function updateWatchSensors_(event) {
        var
            unit = this,
            prevMessage = typeof unit.getPrevMessage === 'function' ? unit.getPrevMessage() : null,
            lastMessage = unit.getLastMessage(),
            msgParams = unit.getMessageParams(),
            sensors = unit.getSensors(),
            sensorsData = {};
        for (var sensorId in sensors) {
            var sensor = sensors[sensorId],
                sensorC = false;
            if (typeof sensor.c !== 'undefined') {
                try {sensorC = app.wialon.util.Json.parse(sensor.c);}
                catch (e) {}
            }
            if (msgParams === null ||
                sensorC === false ||
                sensorC.act !== 1
            ) {
                sensorsData[sensorId] = unit.calculateSensorValue(sensor, lastMessage);
            } else {
                var tmpMsg = {f:7, i:32, o:32, tp:'ud', p:{}, pos: null};
                if (!msgParams || !lastMessage) {
                    continue;
                }
                for (var param in msgParams) {
                    if (param === 'posinfo') {
                        continue;
                    }
                    if (typeof msgParams[param] !== 'undefined') {
                        tmpMsg.p[param] = msgParams[param].v;
                    }
                }

                // calculate time from messages params
                tmpMsg.t = getSensorMsgParamsChangeTime(unit, sensor);

                // add params from last message
                // UNCOMMENT AFTER HOSTING FIX (ask shmi or deal)
                // for (var param in lastMessage.p) {
                //     if (param in tmpMsg.p && tmpMsg.p[param] != lastMessage.p[param]) {
                //         tmpMsg.p[param] = lastMessage.p[param];
                //
                //         if (tmpMsg.t < lastMessage.t) {
                //             tmpMsg.t = lastMessage.t;
                //         }
                //     }
                // }

                if (typeof msgParams.posinfo !== 'undefined') {
                    if (typeof msgParams.posinfo.v !== 'undefined') {
                        tmpMsg.pos = msgParams.posinfo.v;
                    }
                    if (typeof msgParams.speed !== 'undefined') {
                        tmpMsg.pos.s = msgParams.speed;
                    } else if (lastMessage.pos !== null) {
                        if (typeof lastMessage.pos.s !== 'undefined') {
                            tmpMsg.pos.s = lastMessage.pos.s;
                        }
                    }

                } else if (typeof lastMessage.pos !== 'undefined') {
                    tmpMsg.pos = lastMessage.pos;
                    tmpMsg.t = lastMessage.t;
                }
                sensorsData[sensorId] = unit.calculateSensorValue(sensor, tmpMsg, prevMessage);
            }
        }
        updateWatchSensorsCallback_(0, sensorsData, unit, lastMessage && lastMessage.t);
    };

    /** Magic method to calculate
     */
    var getSensorMsgParamsChangeTime = function(unit, sensor) {
        var params = sensor.p.split(/\+|\-|\*|\/|\^/g);
        var msgParams = unit.getMessageParams();
        if (!msgParams) {
            return [];
        }
        var times = [];
        for (var i = 0; i < params.length; i++) {
            var param = params[i].replace(/^\s+|\s+$|\(|\)|\:\d+/g, "");
            if (param.match(/\[|\]|const|\#/gi)) {
                continue;
            }
            if (param == "speed" || param == "altitude" || param == "sats" || param == "course" || param == "lat" || param == "lon" || param == "time") {
                if (typeof msgParams.posinfo != "undefined") {
                    times.push(msgParams.posinfo.ct);
                }
            } else {
                if (typeof msgParams[param] != "undefined") {
                    times.push(msgParams[param].ct);
                }
            }
        }
        var time = 0;
        if (times.length) {
            time = times.slice(0).sort().reverse()[0];
        }
        return time;
    }

    /**
     * Get unit custom & admin fields
     * @private
     * TODO: add eventListener on update custom field
     * @param  {object} unit wialon object source
     * @return {array}  array of objects to print fields
     */
    app.units.getCustomFieldsArray_ = function getCustomFieldsArray_(unit) {
        var
            oldCFields = unit.customFields(),
            oldCFieldsById = {},
            i,
            cFields = unit.getCustomFields(),
            aFields = unit.getAdminFields(),
            resItem,
            res = [];

        for (i in aFields) {
            resItem = {
                id: i,
                name: aFields[i].n,
                value: aFields[i].v,
                visible: ko.observable(true)
            };
            res.push( resItem );
        }

        for (i in cFields) {
            resItem = {
                id: i,
                name: cFields[i].n,
                value: cFields[i].v,
                visible: ko.observable(true)
            };
            res.push( resItem );
        }

        // Set visibility flag
        if (oldCFields) {
            for (i in oldCFields) {
                oldCFieldsById[ oldCFields[i].id ] = oldCFields[i];
            }
            for (i in res) {
                if ( oldCFieldsById[ res[i].id ] && !oldCFieldsById[ res[i].id ].visible() ) {
                    res[i].visible( oldCFieldsById[ res[i].id ].visible() );
                }
            }
        }

        return res;
    };


    /**
     * Draw graph for unit sensor info window using Rickshaw
     * @private
     */
    var drawUnitSensorInfoGraph_ = function drawUnitSensorInfoGraph_() {
        var
            sensor = app.units.currentSensor(),
            sensorHistoryData = sensor.history.getDataXY(),
            $sensorInfoGraph = $c_.sensor_info_modal.find(SENSOR_INFO_GRAPH_);

        // Instantiate our graph
        $sensorInfoGraph.empty();

        if ( sensorHistoryData.data.length ) {
            app.units.sensorInfoGraph = new Rickshaw.Graph({
                element: $sensorInfoGraph[0],
                // width: $sensorInfoGraph.width(),
                // height: $sensorInfoGraph.height(),
                // min: sensorHistoryData.min,
                // max: sensorHistoryData.max,
                min: 'auto',
                // max: 'auto',
                padding: {
                    top: 0.2
                },
                interpolation: '', // [linear || step-after || cardinal || basis]
                offset: 'zero', // [silhouette || wiggle || expand || zero] see https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-offset

                // A string containing the name of the renderer to be used. Options include area, stack, bar, line, and scatterplot. Also see the multi meta renderer in order to support different renderers per series.
                // https://github.com/shutterstock/rickshaw#renderer
                renderer: 'line',
                stroke: true,
                series: [
                    {
                        color: 'steelblue',
                        stroke: 'rgba(0,0,0.15,0)',
                        // name: '',
                        data: sensorHistoryData.data,
                        maxDataPoints: 3
                    }
                ]
            });

            var x_axis = new Rickshaw.Graph.Axis.X( {
                graph: app.units.sensorInfoGraph,
                orientation: 'bottom',
                element: document.getElementById('x_axis'),
                pixelsPerTick: 80,
                ticks: 2,
                tickFormat: function(timestamp) {
                    var
                        currentSensor = app.units.currentSensor(),
                        dateTimeFormat = (currentSensor.history.period === 'today' && !currentSensor.history.periodOffset) ? app.user.currentUserTimeFormat : app.user.currentUserDateTimeFormat;

                    return app.wialon.util.DateTime.formatTime(timestamp,   1, dateTimeFormat);
                }
            } );

            /*exported x_axis */
            var y_axis = new Rickshaw.Graph.Axis.Y( {
                graph: app.units.sensorInfoGraph,
                orientation: 'left',
                tickFormat: function(val) {
                    /* global formatNumber */
                    return formatNumber(val);
                },
                element: document.getElementById('y_axis'),
            } );

            app.units.sensorInfoGraph.render();

            app.units.sensorInfoGraphPreview = new Rickshaw.Graph.RangeSlider.Preview( {
                graph: app.units.sensorInfoGraph,
                element: document.getElementById('preview')
            } );

            var hoverDetail = new Rickshaw.Graph.HoverDetail( {
                graph: app.units.sensorInfoGraph,
                xFormatter: function(timestamp) {
                    var
                        currentSensor = app.units.currentSensor(),
                        dateTimeFormat = (currentSensor.history.period === 'today' && !currentSensor.history.periodOffset) ? app.user.currentUserTimeFormat : app.user.currentUserDateTimeFormat;

                    return app.wialon.util.DateTime.formatTime(timestamp,   1, dateTimeFormat);
                },
                yFormatter: function(y) {
                    var
                        res;

                    if (y === app.wialon.item.MUnitSensor.invalidValue) {
                        res = app.lang.unavailable;
                    }
                    else {
                        y = Number( y.toFixed(app.core.DEFAULT_FIXED_TO) );
                        res = y % 1 ? y : parseInt(y, 10);

                        res = app.units.getSensorCounterValueWithMetricsToPrint(res, sensor.indicator.metrics, sensor.type);
                    }

                    return res;
                },
                formatter: function(series, x, y, formattedX, formattedY, d) {
                    return formattedY;
                }
            });
/*
            var annotator = new Rickshaw.Graph.Annotate( {
                graph: graph,
                element: document.getElementById('timeline')
            } );
*/
        }
    };

    /**
     * Draw log table with notifications (registered events from the app) in sensor info window
     */
    var sensorInfoDrawLogTable_ = function sensorInfoDrawLogTable_(){
        if ( !app.units.currentSensor() || !app.units.currentSensor().history.eViolationsArr.length ) {
            $c_.sensor_info_log_table.closest('.dataTables_wrapper').hide();
            $c_.sensor_info_log_table.closest('div.sensor_info_log_table_container').hide();
            return false;
        }
        else {
            // Add data & draw immidiately
            sensorInfoLogTable_.fnClearTable();
            sensorInfoLogTable_.fnAddData(
                app.units.currentSensor().history.eViolationsArr,
                true
            );
            $c_.sensor_info_log_table.closest('.dataTables_wrapper').show();
            $c_.sensor_info_log_table.closest('div.sensor_info_log_table_container').show();
        }
        return true;
    };

    /**
     * Sensor info change period offset handler
     */
    var sensorInfoChangePeriodOffsetLoadDataHandler_ = function sensorInfoChangePeriodOffsetLoadDataHandler_() {
        var
            currentSensor = app.units.currentSensor();

        if (app.units.sensorInfoGraph) {
            // Reset graph preview
            app.units.sensorInfoGraph.window.xMin = undefined;
            app.units.sensorInfoGraph.window.xMax = undefined;

            app.units.sensorInfoGraph.series[0].data = currentSensor.history.periodData;
            if ( !currentSensor.history.periodData.length ) {
                app.units.sensorInfoGraph.series[0].data = [{x: 0, y: app.wialon.item.MUnitSensor.invalidValue}];
            }
            app.units.sensorInfoGraph.update();
        }

        // drawUnitSensorInfoGraph_();

        sensorInfoDrawLogTable_();

        app.core.appStateSave();
    };

    /**
     * Sensor info get last valid sensor value with translated metrics
     */
    var sensorInfoGetValueToPrint_ = function sensorInfoGetValueToPrint_(sensor) {
        var
            res,
            updatedLastValue = sensor.history.getLastValid();

        if (updatedLastValue === false) {
            return app.lang.unavailable;
        }

        res = updatedLastValue.val;

        res = app.units.getSensorCounterValueWithMetricsToPrint(res, sensor.indicator.metrics, sensor.type);

        return res;
    };

    // ***************************
    // Public Properties & Methods
    // ***************************

    /**
     * sensors & counters to watch for REDRAW by { unitId: { sensorId1: sensor1DataObj, sensorId2: sensor2DataObj...}, unitId2: [...] }
     * link to this obj is in current desktop
     * @type {Object}
     */
    app.units.watchSensors = {};
    app.units.watchCounters = {};

    // Units list
    app.units.listById = {},
    app.units.list = ko.observableArray([]);
    app.units.listVisible = ko.observable(true);
    // Whether to return back to units list window
    app.units.backToUnit = false;

    // Unit sensors
    app.units.sensorsPanelUnit = ko.observable(false);
    app.units.sensorsPanelData = ko.observableArray([]);
    app.units.sensorsPanelCounters = ko.observableArray([]);
    app.units.makeSettingsDefaults = ko.observable(false);

    // Unit sensor properties
    app.units.currentSensor = ko.observable(false);
    app.units.sensorPropertiesToValidate = {
        min: ko.observable(true),
        max: ko.observable(true),
        fit: ko.observable(true),
        lower_bound: ko.observable(true),
        upper_bound: ko.observable(true),
        email: ko.observable(true),
        phone: ko.observable(true),
        url: ko.observable(true),
        scheme: ko.observableArray([])
    };

    app.units.sensorPropertiesValid = ko.computed(function(){
        var
            p;

        for (p in app.units.sensorPropertiesToValidate) {
            if ( !app.units.sensorPropertiesToValidate[p]() ) {
                return false;
            }
        }

        return true;
    });
    app.units.sensorGroups = $.indicator.getGroups();
    app.units.sensorSkins = $.indicator.getSkins();
    app.units.currentSensorGroup = ko.computed(function(){
        var
            i,
            j,
            sensorGroupsLength,
            skinsLength,
            currentSensor = app.units.currentSensor(),
            currentSensorSkin;

        if (currentSensor) {
            currentSensorSkin = currentSensor.indicator.skin;
            for (i = 0, sensorGroupsLength = app.units.sensorGroups.length; i < sensorGroupsLength; i++) {
                for (j = 0, skinsLength = app.units.sensorGroups[i].skins.length; j < skinsLength; j++) {
                    if (currentSensorSkin === app.units.sensorGroups[i].skins[j]) {
                        return app.units.sensorGroups[i].name;
                    }
                }
            }
        }

        return app.units.sensorGroups[0].name;
    });

    // Unit sensor info
    app.units.sensorsInfo = {};
    app.units.sensorInfoGraph = false;
    app.units.sensorInfoGraphPreview = false;
    app.units.sensorInfoCanViewPeriodData = ko.computed(function(){
        return Boolean(
                        app.units.currentSensor() &&
                        Number(app.units.currentSensor().indicator.sId) &&
                        app.wialon.util.Number.and(
                            app.units.listById[ app.units.currentSensor().indicator.uId ].userAccess(),
                            app.wialon.item.Item.accessFlag.execReports
                        ));
    });
    app.units.sensorInfoPeriodText = ko.observable(false);
    app.units.sensorInfoPeriodOffset = ko.observable(0);

    /**
     * Init desktops DOM elements, called in core.startApp
     */
    app.units.initDOM = function initDOM() {
        var
            e,
            GRIDSTER = '.gridster',
            GRID_ELEM = '.grid_elem',
            WIDGET_SENSOR = '.grid_sensor',
            WIDGET_BTN_DELETE = 'gs-delete',
            WIDGET_BTN_OPTIONS = 'gs-options',
            WIDGET_BTN_INFO = 'gs-info',
            WIDGET_BTN_COMMAND = 'gs-commands',
            WIDGET_BTN_UNIT_SENSORS = 'gs-unitSensors',
            $gridster = app.$(GRIDSTER);


        this.handlersBtns = function(event, widget) {
            var
                id = (widget) ? $(widget).attr('id').split('_') : app.$(this).closest(GRID_ELEM).attr('id').split('_'),
                uId = id[0],
                sId = id[1],
                currentSensor = Number(sId) ? app.units.watchSensors[uId][sId] : app.units.watchCounters[uId][sId];

            // Determine the action
            if ( app.$(this).hasClass(WIDGET_BTN_DELETE) ) {
                app.units.removeWatchItem(uId, sId);
                app.core.appStateSave();
            }
            else if ( app.$(this).hasClass(WIDGET_BTN_OPTIONS) ) {
                app.units.showUnitSensorProperties( currentSensor );
            }
            else if ( app.$(this).hasClass(WIDGET_BTN_INFO) ) {
                app.units.sensorInfoShow( currentSensor );
            }
            else if ( app.$(this).hasClass(WIDGET_BTN_UNIT_SENSORS) ) {
                app.units.unitWindowShow( app.units.listById[uId] );
            }
            else if ( app.$(this).hasClass(WIDGET_BTN_COMMAND) && ! $(this).hasClass('disabled-btn-cmd')) {
                app.units.commandsWindowShow( app.units.listById[uId] );
            }

            return false;
        };

        var _dragged = 0;
        var _showPopover = 0;

        // Cache commonly used elements
        for (e in pendingCachingElements_) {
            $c_[e] = app.$( pendingCachingElements_[e] );
        }

        widgetTmpl_ = app._.template(
            app.$(GRIDSTER_ELEMENT_TMPL_).html(),
            null,
            {
                variable: 'data'
            }
        );

        var togglePointerEvents_ = function togglePointerEvents_(e, ui, $widget) {
            $gridster.css('pointer-events', ($gridster.css('pointer-events') === 'none' ? 'auto' : 'none') );
            if( ! $widget)
                return true;

            if($widget.attr('data-sizex')*1 > 6){
                $widget.removeClass('hide-ctrl');
            }else{
                $widget.addClass('hide-ctrl');
            }
        };

        // Show title only when text-overflow is active
        $c_.units_holder.on({
            'mouseenter.overflowedTitle': function(event) {
                /* global isTextOverflowActive */
                var
                    $realTarget = app.$(event.target),
                    prevTitle = $realTarget.attr('title'),
                    newTitle = $realTarget.text();

                if (isTextOverflowActive($realTarget[0])) {
                    if (prevTitle !== newTitle) {
                        $realTarget.attr('title', newTitle );
                    }
                }
                else {
                    if (prevTitle) {
                        $realTarget.removeAttr('title');
                    }
                }

                return true;
            }
        }, 'td.uname > div');

        window.addEventListener(
            'resize',
            _.throttle(
                unitsHolderOverflowFix_,
                1000,
                {leading: false}
            )
        );

        // Init gridster
        var
            rows = Math.floor( $gridster.height() / 16 ),
            cols = Math.floor( $gridster.width() / 16 );

        app.gridster = app.core.$c.grid_cont.gridster({
            widget_selector: GRID_ELEM,
            // widget_base_dimensions: [103, 95],
            widget_base_dimensions: [16, 16],
            widget_margins: [0, 0],
            // min_rows: 1,
            min_rows: rows,
            min_cols: cols,
            // min_cols: 1,
            autogenerate_stylesheet: false,
            avoid_overlapped_widgets: false,
            helper: 'clone',
            resize: {
                enabled: true,
                start: function(e, ui){
                    _dragged = 1;
                    togglePointerEvents_(e, ui);
                    ui.$helper.popover('destroy');
                    $('.js-popover').html('');
                    _showPopover = 0;
                },
                resize: function(e, ui, $widget){
                    _dragged = 1;
                    if( ! $widget)
                        return true;

                    if($widget.attr('data-sizex')*1 > 6 && $widget.attr('data-sizey')*1 > 3){
                        $widget.removeClass('hide-ctrl');
                    }else{
                        $widget.addClass('hide-ctrl');
                    }
                },
                stop: function(e, ui, $widget) {
                    togglePointerEvents_(e, ui, $widget);
                    _dragged = 0;

                    if($widget.attr('data-sizex')*1 > 6 && $widget.attr('data-sizey')*1 > 3){
                        $widget.removeClass('hide-ctrl');
                    }else{
                        $widget.addClass('hide-ctrl');
                    }

                    window.setTimeout(function(){
                        $widget.find('.rgraph:first').each(function(){
                            app.utils.resizeRickshawGraph( $.data(this, 'graph') );
                        });
                    }, 300);

                    app.core.appStateSave();
                }
            },
            draggable: {
                start: function(event, ui){
                    _dragged = 1;
                    ui.$helper.popover('destroy');
                    $('.js-popover').html('');
                    _showPopover = 0;
                    togglePointerEvents_(event, ui);
                },
                stop: function(event, ui) {
                    _dragged = 0;
                    togglePointerEvents_();
                    app.core.appStateSave();
                }
            }
        }).data('gridster');

        app.gridster.generate_stylesheet();

        // widget controls mousedown action
        app.core.$c.grid_cont.on(
            {
                'mousedown.sensolator': app.units.handlersBtns
                // 'mousedown.sensolator': $.noop
            },
            WIDGET_SENSOR + ' .' + WIDGET_BTN_DELETE + ',' +
            WIDGET_SENSOR + ' .' + WIDGET_BTN_OPTIONS + ',' +
            WIDGET_SENSOR + ' .' + WIDGET_BTN_UNIT_SENSORS + ',' +
            WIDGET_SENSOR + ' .' + WIDGET_BTN_INFO + ',' +
            WIDGET_SENSOR + ' .' + WIDGET_BTN_COMMAND
        );

        var _showPopoverUnitId = null;

        app.core.$c.grid_cont.on({
            'click.sensolator': function(event) {
                if ( !event.ctrlKey ) {
                    return true;
                }

                var
                    id = app.$(this).attr('id').split('_'),
                    uId = id[0],
                    sId = id[1];

                app.units.removeWatchItem(uId, sId);

                app.core.appStateSave();

                return false;
            },
            "mouseover.sensolator": function(event){
                if(_dragged)
                    return true;

                var id = event.currentTarget.id;
                var self = this;
                id = id.split('_').shift();
                if( ! id)
                    return;

                if( !_showPopoverUnitId || _showPopoverUnitId !== event.currentTarget){
                    $('.js-popover').html('');
                    _showPopoverUnitId = event.currentTarget;
                }

                var allowCmds = ['custom_msg','driver_msg','output_on','output_off','send_position','query_pos','block_engine','unblock_engine','query_photo','query_ddd'];
                var unit = app.units.listById[id];
                if( ! unit)
                    return;
                var cmds = unit.getCommands();
                // filtering of commands
                cmds = _.filter(cmds, function(cmd){ return (cmd.n.substring(0, 7) !== "__app__" && allowCmds.indexOf(cmd.c) !== -1);});
                var $currentTarget = $(event.currentTarget);
                if( ! cmds || !cmds.length)
                    $currentTarget.find('.gs-commands').addClass('disabled-btn-cmd');
                else
                    $currentTarget.find('.gs-commands').removeClass('disabled-btn-cmd');

                if($currentTarget.attr('data-sizex')*1 > 6 && $currentTarget.attr('data-sizey')*1 > 3){
                    $currentTarget.removeClass('hide-ctrl');
                    $(self).popover('destroy');
                    $('.js-popover').html('');
                    _showPopover = 0;
                    return true;
                }

                if(_showPopover)
                    return true;

                $currentTarget.addClass('hide-ctrl');
                var icon = '<span class="popover-unit-icon" style="background-image: url('+unit.getIconUrl()+')"></span>';

                var options = {
                    html: true,
                    // title: '',
                    template:   '<div class="popover"> \
                                    <div class="arrow"></div> \
                                    <div class="popover-title"> \
                                    </div> \
                                    <div class="popover-content"></div> \
                                    <div class="popover-footer"></div> \
                                </div>',
                    content: icon + '<span style="margin-left: 18px;">' + unit.getName()+ '</span>',
                    placement: 'top',
                    container: '.js-popover'
                };

                $currentTarget.popover(options);
                $currentTarget.popover('show');
                $('.js-popover .popover-title').html('<span class="gs-delete"></span><span class="gs-options"></span><span class="gs-info"></span><span class="gs-unitSensors"></span><span class="gs-commands"></span>');

                $('.js-popover .popover').off();
                $('.js-popover .popover').on('mouseout', function(e){
                    var $el = $(e.toElement);
                    if( ! ( ($el.parents('.popover').length) || ($el.parents('.grid_sensor').length) ) ){
                        $currentTarget.popover('destroy');
                        $('.js-popover').html('');
                        _showPopover = 0;
                    }
                });

                $('.js-popover .popover-title').off();
                $('.js-popover .popover-title').on('click', 'span', function(e){
                    if($(e.target).hasClass('gs-delete')){
                        $(self).popover('destroy');
                        $('.js-popover').html('');
                        _showPopover = 0;
                    }
                    app.units.handlersBtns.apply(e.target, [e, self]);
                });
            },
            "mouseout.sensolator": function(event){
                if(_dragged)
                    return true;

                var $el = $(event.toElement);
                if( ! ( ($el.parents('.popover').length) || ($el.parents('.grid_sensor').length) || $el.hasClass('grid_sensor') ) ){
                    $(event.currentTarget).popover('destroy');
                    $('.js-popover').html('');
                    _showPopover = 0;
                    return true;
                }
            }
        }, WIDGET_SENSOR);

        $c_.sensor_props
            // Open active group accordion item
            .on('shown.bs.modal', function(event){
                var
                    currentSensor = app.units.currentSensor();
                // Check if currentSensor is defined
                if (currentSensor) {
                    app.sensorSchemeFocused = _.map(currentSensor.updatedIndicator.scheme(), _.clone);
                    app.sensorSchemeFocusedMinMax = [ currentSensor.updatedIndicator.min(), currentSensor.updatedIndicator.max() ];
                } else {
                    if (app.sensorSchemeFocused) {
                        delete app.sensorSchemeFocused;
                    }
                    if (app.sensorSchemeFocusedMinMax) {
                        delete app.sensorSchemeFocusedMinMax;
                    }
                }
                var
                    $e = $c_.sensor_props.find('.panel-collapse.active');

                if ( !$e.hasClass('in') ) {
                    $e.parent().find('[data-toggle="collapse"]').click();
                }
            })
            // Handle Unit sensor props popup closing
            .on('hidden.bs.modal', function(event){
                $c_.sensor_info_current_skin.data('indicator', {});
                $c_.sensor_info_current_skin.data('indicator_old', {});

                // If update is not fired before, then reset updated sensors props
                if (app.units.currentSensor()) {
                    app.units.sensorWindowCancel();
                }
                // Check if we'll need to remove prev. opened scheme
                if (app.sensorSchemeFocused) {
                    delete app.sensorSchemeFocused;
                }
                if (app.sensorSchemeFocusedMinMax) {
                    delete app.sensorSchemeFocusedMinMax;
                }

                !$c_.sensor_info_modal.hasClass('in') && app.units.currentSensor(false);

                $c_.sensor_props.find('.panel-collapse.in').collapse('hide');

                // Open unit window
                // TODO: mb complete this
                if ( app.units.backToUnit ) {
                    app.units.unitWindowShow( app.units.backToUnit );
                    app.units.recalcLastMessage( app.units.backToUnit );
                    app.units.backToUnit = false;
                }

                // Disable previous colorpickers
                app.units.colorPicker.disable();
            });

        // Graph group shown event, redraw thumbnail graph
        $c_.sensor_props.on(
            {
                'shown.bs.collapse': function(event){
                    app.$(event.target).find('.rgraph').each(function(){
                        app.utils.resizeRickshawGraph( $.data(this, 'graph') );
                    });
                }
            },
            '#g_graph'
        );

        // Sensors info popup
        app.core.$c.grid_cont.on({
            'dblclick': function(event) {
                var
                    id = app.$(this).attr('id').split('_'),
                    uId = id[0],
                    sId = id[1];

                app.units.sensorInfoShow( Number(sId) ? app.units.watchSensors[ uId ][ sId ] : app.units.watchCounters[ uId ][ sId ] );
            }
        }, '.grid_elem');
        $c_.sensor_info_modal.on('hidden.bs.modal', function(event){
            app.units.sensorInfoGraph = false;
            app.units.sensorInfoGraphPreview = false;

            !$c_.sensor_props.hasClass('in') && app.units.currentSensor(false);

            sensorInfoLogTable_.fnClearTable();
            $c_.sensor_info_log_table.closest('.dataTables_wrapper').hide();
            $c_.sensor_info_log_table.closest('div.sensor_info_log_table_container').hide();

            // Open unit window
            if ( app.units.backToUnit ) {
                app.units.unitWindowShow( app.units.backToUnit );
                app.units.recalcLastMessage( app.units.backToUnit );
                app.units.backToUnit = false;
            }
        });

        // Sensor info notifications table
        sensorInfoLogTable_ = $c_.sensor_info_log_table.dataTable({
            sScrollY: '100px',
            bAutoWidth: false, // Don't calculate auto width, we set it in aoColumns
            aaData: [],
            aaSorting: [[0, 'desc']], /* Initial sort */
            aoColumns: [
                {
                    mData: 'time',
                    // sClass: 'n-time',
                    mRender: function(data, type, full) {
                        return '<div class="n-time">' + app.wialon.util.DateTime.formatTime(data, 2, app.user.currentUserDateTimeFormat) + '</div>';
                    }
                },
                {
                    mData: 'val',
                    // sClass: 'n-val',
                    mRender: function(data, type, full) {
                        return '<div class="n-val">' + ((data === app.wialon.item.MUnitSensor.invalidValue) ? app.lang.sensor.invalid_value : data ) + '</div>';
                    }
                }
            ],
            sDom: 'rtS',
            bDeferRender: true,
            oLanguage: {
                sEmptyTable: '',
                sZeroRecords: ''
            }
        });
    };

    /**
     * Init handler on wialon loaded event
     * here it loads units, init unit event listeners and etc. staff
     */
    app.units.initOnWialonLoaded = function initOnWialonLoaded() {
        loadUnits_();
    };

    /**
     * Recalculate last message for unit
     * @param  {object} wialon unit object
     */
    app.units.recalcLastMessage = function recalcLastMessage(unit) {
        updateWatchSensors_.call( unit );
    };

    /**
     * Recalc all units sensors & counters immediately
     */
    app.units.recalcAllUnitsImmediate = function recalcAllUnitsImmediate(){
        var
            i;

        for (i in app.units.listById) {
            app.units.recalcLastMessage( app.units.listById[i] );
        }

        updateWatchCounters_();
    };


    /**
     * Recalc all units sensors & counters with throttling
     */
    app.units.recalcAllUnits = _.throttle(app.units.recalcAllUnitsImmediate, 2000);

    /**
     * Get unit sensor value with translated metrics to print, if digital then print only metrics
     * @param  {float} value   sensor value
     * @param  {?string} metrics sensor metrics
     * @param  {?string} type    sensor type
     * @param  {?string} delimiter    string delimiter between value & metrics
     * @return {string}
     */
    app.units.getSensorCounterValueWithMetricsToPrint = (function(){
        var
            SENSOR_METRICS_ON_OFF = 'On/Off',
            CUSTOM_DIGITAL_TYPE = ['engine operation', 'digital' , 'private mode'],
            CUSTOM_DIGITAL_DELIMITER = '/';

        return function getSensorCounterValueWithMetricsToPrint(value, metrics, type, delimiter) {
            var
                res = value;

            // invalid value
            if (value === app.wialon.item.MUnitSensor.invalidValue) {
                res = sensolator.lang.sensor.invalid_value;
            }
            // metrics string is On/Off
            else if ( metrics === SENSOR_METRICS_ON_OFF ) {
                res = res ? app.lang.sensor_digital_on : app.lang.sensor_digital_off;
            }
            // metrics type is digital
            else if (_.contains(CUSTOM_DIGITAL_TYPE, type)) {
                // if we found digital delimiter
                if ( metrics.indexOf(CUSTOM_DIGITAL_DELIMITER) > -1 ) {
                    res = res ? metrics.split(CUSTOM_DIGITAL_DELIMITER)[0] : metrics.split(CUSTOM_DIGITAL_DELIMITER)[1];
                }
                // print default translated On or Off
                else {
                    res = res ? app.lang.sensor_digital_on : app.lang.sensor_digital_off;
                }
            }
            // metrics is another, try replace with translated one
            else {
                typeof delimiter === 'undefined' && (delimiter = ' ');
                res += delimiter + (type && app.lang.sensor_metrics[type] && app.lang.sensor_metrics[type][metrics] || metrics || '');
            }

            return res;
        };
    }());

    /**
     * Focus on unit
     * @param  {unit} unit wialon unit object
     */
    app.units.focusOnUnit = function focusOnUnit(unit) {
        var
            currentDesktop = app.desktops.current();

        if (currentDesktop.background.type() === 'map') {
            app.map.panToUnit(unit);

            // if ( !unit.showOnMap() ) {
            //  app.units.toggleUnitOnMap(unit);
            // }
        }
        else {
            app.units.unitWindowShow(unit);
        }
    };

    /**
     * Show unit sensors window for unit
     * @param  {object} unit wialon unit object
     */
    app.units.unitWindowShow = function unitWindowShow(unit) {
        var
            unitId = unit.getId(),
            sensorId,
            counterType,
            unitSensorsArr = [];

        // Store current unit for panel
        app.units.sensorsPanelUnit(unit);

        // Load all unit sensors for Unit sensors popup
        for (sensorId in app.units.watchSensors[unitId]) {
            unitSensorsArr.push( app.units.watchSensors[unitId][sensorId] );
        }

        app.units.sensorsPanelData( unitSensorsArr );

        app.units.recalcLastMessage(unit);

        unit.customFields( app.units.getCustomFieldsArray_(unit) );

        // Counters
        updateWatchCounters_(unitId);
        app.units.sensorsPanelCounters( app._(app.units.watchCounters[unitId]).values() );
        app._.defer(function(){
            for (counterType in app.units.watchCounters[unitId]) {
                app.$('#t' + app.units.watchCounters[unitId][counterType].usId).indicator(app.units.watchCounters[unitId][counterType].indicator);
            }
        });

        $c_.unit_sensors.modal();

        return true;
    };

    /**
     * Show unit commands window for unit
     * @param  {object} unit wialon unit object
     */
    app.units.commandsWindowShow = function (unit) {
        var
            unitId = unit.getId(),
            sensorId,
            counterType,
            unitSensorsArr = [];

        // Store current unit for panel
        app.units.sensorsPanelUnit(unit);

        // Load all unit sensors for Unit sensors popup
        for (sensorId in app.units.watchSensors[unitId]) {
            unitSensorsArr.push( app.units.watchSensors[unitId][sensorId] );
        }

        app.units.sensorsPanelData( unitSensorsArr );

        app.units.recalcLastMessage(unit);

        unit.customFields( app.units.getCustomFieldsArray_(unit) );

        // Counters
        updateWatchCounters_(unitId);
        app.units.sensorsPanelCounters( app._(app.units.watchCounters[unitId]).values() );
        app._.defer(function(){
            for (counterType in app.units.watchCounters[unitId]) {
                app.$('#t' + app.units.watchCounters[unitId][counterType].usId).indicator(app.units.watchCounters[unitId][counterType].indicator);
            }
        });

        var cmds = unit.getCommandDefinitions();
        var list_cmds = unit.getCommands();
        cmds = _.toArray(cmds);
        var tmp_cmds = [];
        var s = ' \
                <tr class="js-command" data-id="{{id}}"> \
                    <td style="padding: 5px 0; padding-left: 16px;"><strong>{{n}}</strong></br><span class="cmd-description">{{window.sensolator.langs.translate("commands",c)}}</span></td> \
                    <td>{{phone}}</td>  \
                    <td style="text-transform: uppercase; padding: 5px 0;">{{tc}}</td> \
                    <td class="js-change-param column-params" style="padding: 5px 0;">{{_p}}</td> \
                    <td style="padding: 5px 0; padding-right: 16px;""><span class="js-exec-command command-exec"></span></td> \
                </tr>';

        var can_exec = false; // variables for access check
        if (cmds && cmds.length && (unit.getUserAccess() & wialon.item.Unit.accessFlag.executeCommands)) // user access check
            can_exec = true;

        cmds.reverse();

        var getPnoneNumber = function(unit, type, isHtml){
            switch(type){
                case 1:
                    return unit.getPhoneNumber();
                case 2:
                    return unit.getPhoneNumber2();
                default:
                var p = unit.getPhoneNumber() ? ([unit.getPhoneNumber(), unit.getPhoneNumber2()]) : unit.getPhoneNumber2();
                if(isHtml){
                    if(typeof p !== 'string' && p)
                        p = p.join('<br>');
                }

                return p;
            }
        };

        var executeCommand = function(cmd){
            var self = this;
            var _cmd = cmd,
                    $modal = $c_.unit_changed_params;

            var changeParam = (function(){
                var _afterChanged = null;
                var _tpl = $modal.find('.modal-commands-template').html();

                var bindEvents = function(){
                    $modal.find('button.btn.btn-success').off();
                    $modal.find('button.btn.btn-success').on('click', function(){
                        var formData = $modal.find('.modal-body .js-command-param').serializeArray();
                        var data = $.extend({}, _cmd),
                                pos = {};

                        _.forEach(formData, function(o){
                            if(o.name.indexOf('coord') !== -1){
                                pos[o.name.replace('coord-', '')] = o.value;
                            }else{
                                if(data[o.name] !== undefined){
                                    if(data.c !== 'send_position')
                                        data[o.name] = o.value;
                                    else{
                                        if(o.name !== 'n')
                                            data[o.name] = o.value;
                                        else
                                            data['param-name'] = o.value;
                                    }
                                }
                            }
                        });

                        if(data.c === 'send_position'){
                            if( ! pos.y || ! pos.x){
                                app.notify.add(app.langs.translate("invalid-coord"), true, 'error');
                                return;
                            }

                            if(pos.y.match(/[^0-9.]/g) || pos.x.match(/[^0-9.]/g)){
                                app.notify.add(app.langs.translate("invalid-coord-value"), true, 'error');
                                return;
                            }

                            data.p = pos.y + '|' + pos.x + '|' + data['param-name'] + '|' + data.p;
                        }

                        _exec(data, pos, true);
                    });

                    $modal.find('.js-choose-coord').on('click', function(){
                        var $notify = app.notify.add(app.langs.translate('choose-point'));
                        // hide all widgets
                        app.gridster.$wrapper.hide();
                        var $prev_opened_wind = $('.modal.in');
                        $prev_opened_wind.addClass('hidden_modal');
                        $('.modal-backdrop').addClass("hidden");
                        var prev_desk_type = app.desktops.current().background.type();
                        if(prev_desk_type !== 'map'){
                            app.desktops.changeBackground('map');
                        }

                        app.map.addHandlerDbClickToMap(function(coord){
                            $modal.find('input[name=coord-y]').val(coord.y);
                            $modal.find('input[name=coord-x]').val(coord.x);

                        // show all widgets
                            app.gridster.$wrapper.show();
                            $prev_opened_wind.removeClass('hidden_modal');
                            $('.modal-backdrop').removeClass("hidden");
                            $notify.remove();

                            if(prev_desk_type !== 'map'){
                                app.desktops.changeBackground(prev_desk_type);
                            }

                            return false;

                        });
                    });
                };

                return {
                    setAfterChanged: function(callback){
                        if(typeof callback ==='function'){
                            _afterChanged = callback;
                        }

                        return this;
                    },
                    init: function(){
                        var _m = $('#commands-blocks').html();

                        var blocks = (listAllowCommands[cmd.c]) ? listAllowCommands[cmd.c] : [];
                        var data = $.extend({}, _cmd);
                        var other  = {
                            disabled: function(){
                                return ' disabled="disabled"';
                            }
                        };

                        // var pos = self.getPosition();
                        var pos = {x:'', y:''};

                        if(data.c === 'send_position'){
                            data.n = '';
                            if(data.p){
                                var params = data.p.split('|');
                                pos.y = params[0] || pos.y;
                                pos.x = params[1] || pos.x;
                                data.p = params[3] || '';
                                data.n = params[2] || '';
                            }

                            other  = {
                                disabled: ''
                            };
                        }

                        var param = Mustache.render(_m, {
                            blocks: blocks,
                            pos: {x: pos.x, y: pos.y},
                            translate: function(){
                                return function(text, render){
                                    return app.langs.translate(render(text));
                                };
                            },
                            cmd: data,
                            other: other
                        });
                        $modal.find('.modal-body').html(_.template(_tpl, {cmd: data, param: param, other: other}));
                        $c_.unit_commands.modal('hide');
                        $modal.modal();
                        bindEvents();
                    }
                };
            }());

            var _exec = function(cmd, pos, hide, hideCommands){
                // this need for register custom event
                // var position = pos || {x: 0, y: 0};
                // Sending command
                self.remoteCommand(cmd.n, cmd.l, cmd.p, cmd.f,
                    function(code){ // execute command callback
                        if (code) app.notify.add(app.langs.translate('exec-command-error'), true, 'error');
                        else {
                            if(hide)
                                app.units.closeChangedCommandsWindow(true);
                            if(hideCommands)
                                $c_.unit_commands.modal('hide');

                            app.notify.add(app.langs.translate('exec-command-success'), true, 'success');

                            // register custom event
                            // var session = wialon.core.Session.getInstance();
                            // var cmd = unit.getCommandDefinition(command_id);

                            // var cm = _.findWhere(list_cmds, {n:cmd.n}) || {};
                            // var desc = 'Unit: '+ self.getName() +' Command "' + cmd.n + '", phone: ' + getPnoneNumber(self, cmd.f) + ', type: ' + cm.t;
                            // self.registryCustomEvent(sss.getServerTime(), desc, (position.x || 0), (position.y || 0), 0, function(code){});
                        }
                });
            };

            var checkParam = function(cmd){
                if( listAllowCommands[cmd.c] && _.where(listAllowCommands[cmd.c], {noparam:true}).length ){
                    _exec(cmd, {}, null, true);
                    return;
                }

                changeParam.setAfterChanged(_exec).init(cmd);
            };

            checkParam(cmd);
        };
        var defaults = {
            "c": "",
            "f":'',
            "l": "",
            "n": "",
            "p": "",
            "t": ""
        };
        var listAllowCommands = {
            'custom_msg': [
                {names: true},
                {text: true}
            ],
            'driver_msg': [
                {names: true},
                {text: true}
            ],
            'output_on':[
                {names: true},
                {'activate_output': true}
            ],
            'output_off':[
                {names: true},
                {'deactivate_output': true}
            ],
            'send_position': [
                {names: true},
                {text: true},
                {coord: true}
            ],
            'query_pos':[
                {names: true},
                {noparam: true}
            ],
            'block_engine':[
                {names: true},
                {noparam: true}
            ],
            'unblock_engine':[
                {names: true},
                {noparam: true}
            ],
            'query_photo':[
                {names: true},
                {noparam: true}
            ],
            'query_ddd':[
                {names: true},
                {noparam: true}
            ]
        };

        _.forEach(list_cmds, function(val){
            if (typeof val.n !== "undefined" && val.n && val.n.substring(0,7) === "__app__")
                return;
            var cmd = _.findWhere(cmds, {n:val.n}) || {};
            var tmp = $.extend({}, defaults, cmd, val);
            tmp.phone = getPnoneNumber(unit, tmp.f, true);
            if((wialon.util.Number.and(unit.getUserAccess(), tmp.a) !== tmp.a) && ! can_exec)
                tmp.a = '';
            if( ! tmp.t)
                tmp.t = '0';
            tmp._p = tmp.p;
            tmp.file = '';

            if(tmp.c.match('upload') && tmp.p){
                tmp._p = '(file)';
                tmp.file = true;
            }

            tmp.tc = (function(){
                var tc = tmp.l;
                if(! tc)
                    tc = '0';
                return app.langs.translate('type-commands', tc);
            }());
            if(listAllowCommands[tmp.c])
                tmp_cmds.push(_.template(s, tmp));
        });

        var tpl = ' \
            <table class="commands-list" style="width: 100%; font-size: 12px;"> \
                <tr style="background: #FFFFFF;"> \
                    <th style="width: 312px;"></th> \
                    <th style="width: 102px;"></th> \
                    <th style="width: 60px;"></th> \
                    <th></th> \
                    <th style="width: 30px;"></th> \
                </tr> \
                {{data}} \
            </table>';

        var html = _.template(tpl, {data: tmp_cmds.join('')});

        $c_.unit_commands.find('.modal-body').html(html).find('.js-command').on('click', function(e){
            var $el = $(e.target),
                    command_id = $(this).attr('data-id'),
                    file = $(this).attr('data-file');

            if($el.hasClass('js-exec-command') && command_id){
                var cmd = unit.getCommandDefinition(command_id);
                if( ! cmd)
                    return;

                executeCommand.call(unit, cmd, file);
            }else{
                if($el.hasClass('js-exec-command'))
                    alert("Not enought rights to execute this command");
            }
        });

        $('#unit_commands_label').html(app.langs.translate('title-commands-window') + ' <strong>' + unit.getName() + '</strong>');
        $c_.unit_commands.modal();

        return true;
    };

    app.units.closeChangedCommandsWindow = function(showDesk){
        $c_.unit_changed_params.modal('hide');
        if(showDesk){
            return;
        }
        $c_.unit_commands.modal('show');
    };

    /**
     * Hide custom field in unit sensors window
     * @param  {object} field field object to hide
     */
    app.units.unitWindowHideCustomField = function unitWindowHideCustomField(field) {
        var
            unit = app.units.sensorsPanelUnit();

        field.visible(false);
        unit.customFieldsShowRestore(true);
    };

    /**
     * Restore (show) all custom fields in unit sensors window
     */
    app.units.unitWindowRestoreCustomFields = function unitWindowRestoreCustomFields() {
        var
            unit = app.units.sensorsPanelUnit();

        unit.customFields([]);
        unit.customFields( app.units.getCustomFieldsArray_(unit) );

        unit.customFieldsShowRestore(false);
    };

    /**
     * Remove watch sensor widget from desktop
     * @param  {int} unitId   wialon unit ID
     * @param  {(int|string)} id wialon unit sensor ID for unit with unitId or if string counter type
     */
    app.units.removeWatchItem = function removeWatchItem(unitId, id) {
        var
            $widget = app.core.$c.grid_cont.find('#' + unitId + '_' + id);

        $widget.length && app.gridster.remove_widget( $widget );

        if (Number(id) > 0) {
            app.units.watchSensors[ unitId ][ id ].onDesktop = false;
            app.units.watchSensors[ unitId ][ id ].updatedOnDesktop && app.units.watchSensors[ unitId ][ id ].updatedOnDesktop(false);
        }
        else {
            if(app.units.watchCounters[ unitId ]){
                app.units.watchCounters[ unitId ][ id ].onDesktop = false;
                app.units.watchCounters[ unitId ][ id ].updatedOnDesktop && app.units.watchCounters[ unitId ][ id ].updatedOnDesktop(false);
            }
        }
    };

    /**
     * Save settings for unit window
     */
    app.units.unitWindowSave = function unitWindowSave() {
        var
            i,
            uId = app.units.sensorsPanelUnit().getId(),
            sId,
            sensorCounter,
            unitSensorsCounters = [
                app.units.watchSensors[uId],
                app.units.watchCounters[uId]
            ];

        // Add/Remove selected/unselected (onDesktop) sensors from unitSensorsCounters
        for (i = unitSensorsCounters.length - 1; i > -1; i--) {
            for (sId in unitSensorsCounters[i]) {
                sensorCounter = unitSensorsCounters[i][sId];
                if ( sensorCounter.updatedOnDesktop() ) {
                    if (!sensorCounter.onDesktop) {
                        // Add to gridster
                        sensorCounter.onDesktop = true;
                        createWidget_(sensorCounter);
                    }
                }
                else if ( sensorCounter.onDesktop ) {
                    app.units.removeWatchItem(uId, sId);
                }
            }
        }

        // Add/Remove selected/unselected (onDesktop) counters from app.units.watchCounters and gridster

        app.units.sensorsPanelUnit(false);
        app.units.sensorsPanelData([]);
        app.units.sensorsPanelCounters([]);

        $c_.unit_sensors.modal('hide');

        app.core.appStateSave();

        return true;
    };

    /**
     * Cancel unit window settings
     */
    app.units.closeCommandsWindow = function () {
        if($c_.unit_changed_params.data('bs.modal') && $c_.unit_changed_params.data('bs.modal').isShown)
            return;

        var
            i,
            uId = app.units.sensorsPanelUnit().getId(),
            sId,
            sensorCounter,
            unitSensorsCounters = [
                app.units.watchSensors[uId],
                app.units.watchCounters[uId]
            ];

        for (i = unitSensorsCounters.length - 1; i > -1; i--) {
            for (sId in unitSensorsCounters[i]) {
                sensorCounter = unitSensorsCounters[i][sId];
                sensorCounter.updatedOnDesktop( sensorCounter.onDesktop );
            }
        }

        app.units.sensorsPanelUnit(false);
        app.units.sensorsPanelData([]);
        app.units.sensorsPanelCounters([]);

        $c_.unit_commands.data('bs.modal').isShown = true;
        $c_.unit_commands.modal('hide');
    };

    /**
     * Cancel unit window settings
     */
    app.units.unitWindowDontSave = function unitWindowDontSave() {
        var
            i,
            uId = app.units.sensorsPanelUnit().getId(),
            sId,
            sensorCounter,
            unitSensorsCounters = [
                app.units.watchSensors[uId],
                app.units.watchCounters[uId]
            ];

        for (i = unitSensorsCounters.length - 1; i > -1; i--) {
            for (sId in unitSensorsCounters[i]) {
                sensorCounter = unitSensorsCounters[i][sId];
                sensorCounter.updatedOnDesktop( sensorCounter.onDesktop );
            }
        }

        app.units.sensorsPanelUnit(false);
        app.units.sensorsPanelData([]);
        app.units.sensorsPanelCounters([]);

        $c_.unit_sensors.modal('hide');
    };

    /**
     * Whether the unit window settings changed
     * @return {boolean} true - settings changed, false - otherwise
     */
    app.units.unitWindowCheckChange = function unitWindowCheckChange() {
        var
            i,
            uId = app.units.sensorsPanelUnit().getId(),
            sId,
            sensorCounter,
            unitSensorsCounters = [
                app.units.watchSensors[uId],
                app.units.watchCounters[uId]
            ];

        for (i = unitSensorsCounters.length - 1; i > -1; i--) {
            for (sId in unitSensorsCounters[i]) {
                sensorCounter = unitSensorsCounters[i][sId];
                if (sensorCounter.updatedOnDesktop() !== sensorCounter.onDesktop) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
     * Update watch sensors gridster options
     */
    app.units.updateGridsterPositionModel = function updateGridsterPositionModel() {
        var
            i,
            uId,
            sId,
            unitSensorsCounters = [
                app.units.watchSensors,
                app.units.watchCounters
            ],
            $widget;

        for (i = unitSensorsCounters.length - 1; i > -1; i--) {
            for (uId in unitSensorsCounters[i]) {
                for (sId in unitSensorsCounters[i][uId]) {
                    $widget = app.core.$c.grid_cont.find('#' + unitSensorsCounters[i][uId][sId].usId);
                    if ( $widget.length ) {
                        unitSensorsCounters[i][uId][sId].gridster = {
                            sizex: $widget.attr('data-sizex'),
                            sizey: $widget.attr('data-sizey'),
                            row: $widget.attr('data-row'),
                            col: $widget.attr('data-col')
                        };
                    }
                }
            }
        }
    };

    /**
     * Clear desktop gridster widgets panel
     */
    app.units.clearWatchItemsPanel = function clearWatchItemsPanel() {
            // unitsList = app.units.list();

        app.units.updateGridsterPositionModel();

        app.units.watchSensors = {};
        app.units.watchCounters = {};

        // app.units.recalcAllUnits();

        app.gridster.remove_all_widgets();
    };

    /**
     * Butch create watchSensors, used when switching between desktops & when app first loads
     * @param  {object} newWatchSensors object of watchSensors
     */
    app.units.createAllWidgets = function createAllWidgets() {
        var
            sensorsCounters = {
                sensors: app.units.watchSensors,
                counters: app.units.watchCounters
            },
            type,
            uId,
            sId,
            sensor,
            widgetProps;

        app.gridster.remove_all_widgets();
        updateWatchCounters_();
        for (type in sensorsCounters) {
            for (uId in sensorsCounters[ type]) {
                for (sId in sensorsCounters[type][uId]) {
                    sensor = sensorsCounters[type][uId][sId];
                    if (sensor.onDesktop) {
                        widgetProps = {
                            'sizex': sensor.gridster.sizex,
                            'sizey': sensor.gridster.sizey,
                            'row': sensor.gridster.row,
                            'col': sensor.gridster.col
                        };
                        createWidget_( sensor, widgetProps );
                    }
                }
            }
        }

        app.user.settings.version = 2;
    };

    /**
     * Handle click on unit sensor/counter
     */
    app.units.unitSensorCounterClick = (function() {
        var
            singeClickTimeout = false,
            singleClickDelay = 200;

        /* global clearSelection */
        var unitSensorCounterClick = function unitSensorCounterClick(item, event) {
            if (singeClickTimeout) {
                window.clearTimeout(singeClickTimeout);
                singeClickTimeout = false;

                // doubleClick code
                app.units.backToUnit = app.units.sensorsPanelUnit();
                app.units.showUnitSensorProperties(item);
                clearSelection();
            }
            else {
                singeClickTimeout = window.setTimeout(function(){
                    singeClickTimeout = false;

                    // singleClick code
                    item.updatedOnDesktop( !item.updatedOnDesktop() );
                }, singleClickDelay);
            }
        };

        return unitSensorCounterClick;
    }());

    /**
     *
     * Unit sensor properties
     *
     */

    /**
     * Show unit sensor/counter info window
     * @param  {object} sensorCounter one of the app.units.watchSensors or app.units.watchCounters
     * @param  {?eventObject} event  event which generate this change
     */
    app.units.showUnitSensorProperties = function showUnitSensorProperties(sensorCounter, event) {
        var
            isSensor = Number(sensorCounter.indicator.sId),
            labelData = {
                UNIT: '<span class="bold">' + _.unescape(app.units.listById[ sensorCounter.indicator.uId ].getName()) + '</span>'
            };

        labelData[ isSensor ? 'SENSOR' : 'COUNTER' ] = '<span class="bold">' + sensorCounter.name + '</span>';

        if (event) {
            event.stopPropagation();
        }

        app.units.currentSensor(sensorCounter);

        isSensor && app.notifications.updateObservables();

        $c_.sensor_props_label.html(
            isSensor ? app.lang.sensor_properties_header(labelData) : app.lang.counter_properties_header(labelData)
        );

        $c_.sensor_props
            .modal()
            .find('input.clearable').trigger('input');


        // Disable previous colorpickers
        app.units.colorPicker.disable();

        $c_.sensor_info_current_skin.indicator(sensorCounter.indicator);

        // Enable colorpickers
        app.units.colorPicker.enable();
    };

    /**
     * Select sensor skin
     * @param  {string} skin unit sensor skin name
     */
    app.units.sensorWindowSelectSensorSkin = function sensorWindowSelectSensorSkin(skin) {
        var
            currentSensor = app.units.currentSensor(),
            indicatorOptions;

        if (currentSensor.updatedIndicator.skin() === skin) {
            return;
        }

        currentSensor.updatedIndicator.skin(skin);

        // TODO: think about refactoring it
        // no need to update value
        delete currentSensor.updatedIndicator.val;
        delete currentSensor.updatedIndicator.valid;

        indicatorOptions = app.utils.extendKo({}, currentSensor.indicator, currentSensor.updatedIndicator);

        $c_.sensor_info_current_skin.indicator(indicatorOptions);

        // Toggle colorpickers
        app.units.colorPicker.toggle(currentSensor);

        // Uncheck make default style input
        if ( app.units.makeSettingsDefaults() ) {
            app.units.makeSettingsDefaults(false);
        }

        // app.units.recalcLastMessage( app.units.sensorsPanelUnit() );
    };

    /**
     * Update preview of sensor with new options
     */
    app.units.sensorWindowUpdatePreview = function sensorWindowUpdatePreview() {
        var
            currentSensor = app.units.currentSensor(),
            indicatorOptions;

        if (!currentSensor) {
            return;
        }

        // TODO: think about refactoring it
        // no need to update value
        delete currentSensor.updatedIndicator.val;
        delete currentSensor.updatedIndicator.valid;

        indicatorOptions = app.utils.extendKo({}, currentSensor.indicator, currentSensor.updatedIndicator);

        indicatorOptions.min = parseFloat( indicatorOptions.min );
        indicatorOptions.max = parseFloat( indicatorOptions.max );

        $c_.sensor_info_current_skin.indicator( indicatorOptions );

        app.units.colorPicker.toggle( currentSensor );
        return true;
    };

    app.units.colorPicker = {
        toggle: function(currentSensor) {
            // Disable previous colorpickers
            app.units.colorPicker.disable();
            // Enable colorpickers
            app.units.colorPicker.enable(currentSensor);
        },
        enable: function(currentSensor) {
            currentSensor = currentSensor || app.units.currentSensor();

            if ( !currentSensor ) {
                return;
            }

            var
                onChangeColor = function(color, target) {
                    if ( app.sensorRemoved ) {
                        delete app.sensorRemoved;
                        return false;
                    }
                    var
                        colorNumber = app.$(target).attr('data-colorable');
                    if ( !colorNumber ) {
                        return false;
                    }
                    // Check if it is scheme
                    if (~colorNumber.indexOf('scheme')) {
                        colorNumber = colorNumber.split('_');
                        if (colorNumber.length > 1) {
                            var
                                scheme = _.map(currentSensor.updatedIndicator.scheme(), _.clone);
                            scheme[colorNumber[1]].color = color.toHexString();
                            // Update scheme
                            currentSensor.updatedIndicator.scheme.removeAll();
                            currentSensor.updatedIndicator.scheme.splice.apply(currentSensor.updatedIndicator.scheme, [0, 0].concat(scheme));
                            app.sensorSchemeFocused = _.map(currentSensor.updatedIndicator.scheme(), _.clone);
                            app.sensorSchemeFocusedMinMax = [ currentSensor.updatedIndicator.min(), currentSensor.updatedIndicator.max() ];
                            app.units.sensorWindowUpdatePreviewThrottled();
                        }
                        return false;
                    }
                    currentSensor.updatedIndicator[colorNumber](color.toHexString());
                    app.units.sensorWindowUpdatePreviewThrottled();
                },
                bindRangeEvents = function(target, index) {
                    var
                        self = app.$(target),
                        // Try to find spectrum container
                        _cnt = self.closest('.modal').find('.sp-container:visible');
                    if (!_cnt.length) {
                        return;
                    }
                    app.$('.sp-remove-button a', _cnt).on('click', function(e) {
                        e.preventDefault();
                        // Hide colorpicker if necessary
                        var
                            _colorpicker = app.$('.sp-container:visible'),
                            scheme = _.map(currentSensor.updatedIndicator.scheme(), _.clone);
                        if (_colorpicker.length) {
                            app.sensorRemoved = true;
                            _colorpicker.remove();
                        }
                        // Check if it is the last element in range
                        if ( index === scheme.length - 1 ) {
                            scheme[index - 1].value = 100;
                        }
                        scheme.splice(index, 1);
                        // Update scheme
                        currentSensor.updatedIndicator.scheme.removeAll();
                        currentSensor.updatedIndicator.scheme.splice.apply(currentSensor.updatedIndicator.scheme, [0, 0].concat(scheme));
                        app.sensorSchemeFocused = _.map(currentSensor.updatedIndicator.scheme(), _.clone);
                        app.sensorSchemeFocusedMinMax = [ currentSensor.updatedIndicator.min(), currentSensor.updatedIndicator.max() ];
                        // Update widget
                        app.units.sensorWindowUpdatePreviewThrottled();
                    });
                    app.$('.sp-range a', _cnt).on('click', function(e) {
                        e.preventDefault();
                        app.units.sensorWindowSchemeUpdate(index, self);
                    });
                    app.$( '.sp-range input[type="text"]', _cnt).on('keyup', function(e) {
                        e.preventDefault();
                        if (e.keyCode === 13 || e.which === 13) {
                            app.units.sensorWindowSchemeUpdate(index, self);
                            return;
                        }
                        var
                            target = e.target;
                        if ( target.value !== '-' ) {
                            while ( isNaN( target.value ) ) {
                                target.value = target.value
                                    .split( '' )
                                    .reverse()
                                    .join( '' )
                                    .replace( /[\D]/i, '' )
                                    .split( '' )
                                    .reverse()
                                    .join( '' );
                            }
                        }
                    });
                },
                unbindRangeEvents = function(target) {
                    var
                        self = app.$( target ),
                        // Try to find spectrum container
                        _cnt = self.closest('.modal').find('.sp-container:visible');
                    if ( !_cnt.length ) {
                        return;
                    }
                    app.$( '.sp-remove-button a', _cnt).off();
                    app.$( '.sp-range input[type="text"]', _cnt).off();
                },
                controllableRemove = function(target, index, length) {
                    var
                        self = app.$(target),
                        // Try to find spectrum container
                        _cnt = self.closest('.modal').find('.sp-container:visible');
                    if ( !_cnt.length ) {
                        return;
                    }
                    var
                        $button = app.$( '.sp-remove-button', _cnt);
                    length = length || currentSensor.updatedIndicator.scheme().length;
                    if (length > 1) {
                        if (!$button.length) {
                            var
                                _tpl = app.$('#colorrange_remove_tmpl').html(),
                                params = {
                                    langs: {
                                        remove: app.lang.sensor.remove
                                    }
                                };
                            _cnt.append(app._.template(_tpl, params));
                        }
                    } else if ($button.length) {
                        $button.remove();
                    }
                };
            /* global getPalette */
            $c_.sensor_props.find('.colorable').spectrum({
                preferredFormat: 'hex',
                showButtons: 0,
                showInput: 1,
                showPalette: 1,
                showSelectionPalette: 0,
                palette: getPalette(),
                appendTo: $c_.sensor_props,
                change: function( color ) {
                    onChangeColor( color, this );
                },
                move: function( color ) {
                    onChangeColor( color, this );
                },
                hide: function() {
                    unbindRangeEvents( this );
                    var
                        deletions = app.$('.sp-removable' );
                    // Check
                    if (deletions.length) {
                        deletions.remove();
                    }
                },
                show: function() {
                    var
                        self = app.$( this );
                    self.spectrum( 'set', self.css('background-color') );
                    self.siblings('.colorable').spectrum('hide');
                    var
                        colorNumber = self.attr('data-colorable'),
                        // Try to find spectrum container
                        _cnt = self.closest('.modal').find('.sp-container:visible');
                    if (!_cnt.length || !colorNumber || !~colorNumber.indexOf('scheme')) {
                        return;
                    }
                    // Check if it is scheme
                    colorNumber = colorNumber.split('_');
                    if (colorNumber.length < 2) {
                        return;
                    }
                    var
                        index = ~~colorNumber[1],
                        scheme = _.map(currentSensor.updatedIndicator.scheme(), _.clone),
                        sector = scheme[index],
                        sectorPrev = !index ? {value: currentSensor.updatedIndicator.min()} : scheme[index - 1],
                        _tpl = app.$('#colorrange_range_tmpl').html(),
                        params = {
                            from: sectorPrev.value,
                            to: sector.value || currentSensor.updatedIndicator.max(),
                            langs: {
                                from: app.lang.sensor.from,
                                to: app.lang.sensor.to,
                                add: app.lang.sensor.add
                            }
                        };
                    _cnt.prepend(app._.template(_tpl, params));
                    controllableRemove( this, index );
                    bindRangeEvents( this, index );
                }
            });
        },
        disable: function(currentSensor) {
            $c_.sensor_props.find('.colorable').spectrum('destroy');
        }
    };

    /**
     * The same as sensorWindowUpdatePreview but throttled version
     */
    app.units.sensorWindowUpdatePreviewThrottled = _.throttle(
        app.units.sensorWindowUpdatePreview,
        SENSOR_PREVIEW_UPDATE_THROTTLE_TIME_,
        {leading: true}
    );

    /**
     * Set default color values
     */
    app.units.sensorWindowColorReset = function sensorWindowColorReset() {
        var currentSensor = app.units.currentSensor();
        if (!currentSensor) {
            return;
        }
        $c_.sensor_props.find('.colorable').spectrum('hide');
        currentSensor.updatedIndicator.color_1(DEFAULT_SENSOR_COLOR_1_);
        currentSensor.updatedIndicator.color_2(DEFAULT_SENSOR_COLOR_2_);
        currentSensor.updatedIndicator.color_3(DEFAULT_SENSOR_COLOR_3_);
        app.units.sensorWindowUpdatePreviewThrottled();
    };

    /**
     * Set default color values
     */
    app.units.sensorWindowSchemeReset = function sensorWindowSchemeReset() {
        var currentSensor = app.units.currentSensor();
        if (!currentSensor) {
            return;
        }
        $c_.sensor_props.find('.colorable').spectrum('hide');
        var
            typeScheme = getTypeScheme(currentSensor.updatedIndicator.skin()),
            oldRange = [0, 100],
            newRange = [parseFloat(currentSensor.updatedIndicator.min()), parseFloat(currentSensor.updatedIndicator.max())],
            scheme = _.map(typeScheme[1], _.clone);
        // Get converted values
        scheme = convertSchemeValues(scheme, oldRange, newRange);
        // Update scheme
        currentSensor.updatedIndicator.scheme.removeAll();
        currentSensor.updatedIndicator.scheme.splice.apply(currentSensor.updatedIndicator.scheme, [0, 0].concat(scheme));
        app.units.sensorWindowUpdatePreviewThrottled();
    };

    /**
     * Update scheme by colorpicker
     */
    app.units.sensorWindowSchemeUpdate = function sensorWindowSchemeUpdate(index, self) {
        var currentSensor = app.units.currentSensor();
        if (!currentSensor) {
            return;
        }

        var
            _colorpicker = app.$('.sp-container:visible'),
            scheme = _.map(currentSensor.updatedIndicator.scheme(), _.clone);
        if (!_colorpicker.length) {
            return;
        }
        var
            from = _colorpicker.find('input[name="colorrange_from"]'),
            to = _colorpicker.find('input[name="colorrange_to"]');
        if (!from.length || !to.length) {
            return;
        }
        from = parseFloat( from[0].value );
        to = parseFloat( to[0].value );
        var
            sector = scheme[index],
            sectorPrev = !index ? {value: currentSensor.updatedIndicator.min()} : scheme[index - 1],
            min = sectorPrev.value,
            max = sector.value || currentSensor.updatedIndicator.max();
        // Check if we'll need to update scheme
        if ((from < min) || (to > max) || (max === to && min === from)) {
            var $notify = app.notify.add(app.lang.sensor.err_range);
            setTimeout($notify.remove.bind($notify), 2000);
            return;
        }
        var
            sectors = [null, sector, null],
            $modal = [];
        if ( min !== from ) {
            sectors[0] = $.extend({}, sector);
            sectors[0].value = from;
            if (self) {
                self.spectrum('hide');
                $modal = self.closest('.modal');
            }

        }
        if ( max !== to ) {
            sectors[2] = $.extend({}, sector);
            sector.value = to;
        }
        sectors = sectors.filter(function(v) {
            return v;
        });
        // Update temp. scheme
        scheme.splice.apply(scheme, [index, 1].concat(sectors));
        // Update scheme
        currentSensor.updatedIndicator.scheme.removeAll();
        currentSensor.updatedIndicator.scheme.splice.apply(currentSensor.updatedIndicator.scheme, [0, 0].concat(scheme));
        app.sensorSchemeFocused = _.map(currentSensor.updatedIndicator.scheme(), _.clone);
        app.sensorSchemeFocusedMinMax = [ currentSensor.updatedIndicator.min(), currentSensor.updatedIndicator.max() ];
        // Update widget
        app.units.sensorWindowUpdatePreviewThrottled();
        if ((min !== from) && ($modal.length)) {
            var
                _colorpickers = $modal.find('.colorrange');
            if (_colorpickers.length - index > 1) {
                // Reopen colorpicker
                _colorpickers.eq(index + 1).spectrum('show');
            }
        }
    };

    /**
     * Change min / max
     */
    app.units.sensorWindowRangeChange = function sensorWindowRangeChange(name) {
        var
            currentSensor = app.units.currentSensor(),
            indicatorOptions;
        if (!currentSensor) {
            return;
        }
        var
            min = parseFloat(currentSensor.updatedIndicator.min()),
            max = parseFloat(currentSensor.updatedIndicator.max());
        if (min > max) {
            currentSensor.updatedIndicator.min(max);
            currentSensor.updatedIndicator.max(min);
            min = currentSensor.updatedIndicator.min();
            max = currentSensor.updatedIndicator.max();
            // Trigger focus to new element
            if (~['max', 'min'].indexOf(name)) {
                app.$('#sensor_prop_' + (name === 'max' ? 'min' : 'max')).focus();
            }
        }
        var
            oldRange = app.sensorSchemeFocusedMinMax ? app.sensorSchemeFocusedMinMax : [currentSensor.indicator.min, currentSensor.indicator.max],
            newRange = [min, max],
            scheme = _.map(app.sensorSchemeFocused ? app.sensorSchemeFocused : currentSensor.updatedIndicator.scheme(), _.clone);
        // Get converted values
        scheme = convertSchemeValues(scheme, oldRange, newRange);
        // Update scheme
        currentSensor.updatedIndicator.scheme.removeAll();
        currentSensor.updatedIndicator.scheme.splice.apply(currentSensor.updatedIndicator.scheme, [0, 0].concat(scheme));

        // Check min / max
        if (min === max) {
            var $notify = sensolator.notify.add(sensolator.lang.sensor.err_range);
            setTimeout($notify.remove.bind($notify), 2000);
        }

        // Update preview
        app.units.sensorWindowUpdatePreviewThrottled();
    };

    /**
     * The same as sensorWindowRangeChange but throttled version
     */
    app.units.sensorWindowRangeChangeThrottled = _.throttle(
        app.units.sensorWindowRangeChange,
        SENSOR_PREVIEW_UPDATE_THROTTLE_TIME_,
        {leading: true}
    );

    /**
     * Set sensor defaults skin & options for the same sensor skin
     * @param  {object} sensor wialon unit sensor
     */
    app.units.sensorWindowSetSensorTypeDefaults = function sensorWindowSetSensorTypeDefaults(sensor) {
        var
            i,
            indicatorOptions = {};

        for (i in sensor.updatedIndicator) {
            if ( ko.isObservable(sensor.updatedIndicator[i] )) {
                indicatorOptions[i] = sensor.updatedIndicator[i]();
            }
        }

        sensorDefaultsByType_[ sensor.type ] = indicatorOptions;

        // Apply defaults
        applySensorDefaults_([sensor.type]);
    };

    // TODO: this is temp example code
    app.units.sensorWindowChangeBGImage = function sensorWindowChangeBGImage(scope, event) {
        var
            sensorCounter = app.units.currentSensor(),
            $target = app.$(event.target);

        // Don't update backgroud if there are incorrect URL
        if ( $target.hasClass('invalid') || $target.val().length < 3 ) {
            return;
        }

        sensorCounter.updatedIndicator.bg_image( $target.val() );
        app.units.sensorWindowUpdatePreview();
    };

    /**
     * Sensor window save properties
     */
    app.units.sensorWindowSave = function sensorWindowSave() {
        var
            elem,
            sensorCounter = app.units.currentSensor(),
            indicatorOptions,
            sId = sensorCounter.indicator.sId,
            uId = sensorCounter.indicator.uId,
            unit = app.units.listById[uId];

        // Mark on desktop if sensorCounter skin changed
        if ( !sensorCounter.updatedOnDesktop() && sensorCounter.indicator.skin === DEFAULT_SENSOR_SKIN_ && sensorCounter.updatedIndicator.skin() !== DEFAULT_SENSOR_SKIN_ ) {
            sensorCounter.updatedOnDesktop(true);
        }

        // Strip http for widget background URL
        if (sensorCounter.updatedIndicator.bg_image()) {
            sensorCounter.updatedIndicator.bg_image(
                app.$.trim(
                    app.utils.stripHTTP(
                        sensorCounter.updatedIndicator.bg_image()
                    )
                )
            );
        }

        // Update skin settings
        indicatorOptions = app.utils.extendKo(sensorCounter.indicator, sensorCounter.updatedIndicator);

        // Apply this style as default for all sensors
        if ( app.units.makeSettingsDefaults() ) {
            app.units.sensorWindowSetSensorTypeDefaults( sensorCounter );
            app.units.makeSettingsDefaults(false);
        }

        if ( Number(sId) ) { // Sensor
            // Update notification settings
            app.notifications.updateNotification();
            app.units.recalcLastMessage( unit );
        }
        else { // Counter
            elem = app.core.$c.grid_cont.find('#' + sensorCounter.usId);
            if (elem.length) {
                elem.indicator( sensorCounter.indicator );
            }
        }

        $c_.sensor_props.modal('hide');

        app.core.appStateSave();

        return true;
    };

    /**
     * Cancel sensor window settings
     */
    app.units.sensorWindowCancel = function sensorWindowCancel() {
        var currentSensor = app.units.currentSensor();
        if (!currentSensor) {
            return;
        }

        // Don't save updated data
        app.utils.extendKo(currentSensor.updatedIndicator, currentSensor.indicator);

        $c_.sensor_props.modal('hide');

        app.units.makeSettingsDefaults(false);
    };

    /**
     * Whether the currentSensors settings have been changed
     * @return {boolean} true - settings changed, false - otherwise
     */
    app.units.sensorWindowCheckChange = function sensorWindowCheckChange() {
        var
            res = false,
            currentSensor = app.units.currentSensor(),
            newSettings = currentSensor.updatedIndicator, // check only observables here
            oldSettings = currentSensor.indicator, // not observables
            n;

        for (n in newSettings) {
            if (ko.isObservable(newSettings[n]) && newSettings[n]() !== oldSettings[n]) {
                res = true;
                break;
            }
        }

        return res || app.units.makeSettingsDefaults() || app.notifications.isSettingsChanged();
    };

    /**
     *
     * Unit sensor info
     *
     */

    /**
     * Show sensor info window
     * @param  {object} sensorCounter one of the app.units.watchSensors or app.units.watchCounters
     * @param  {?eventObject} event  event which generate this change
     * @param  {?boolean} showUnitSensorLinks  show 'unit sensors' & 'sensor props' links in the head, by default is false
     */
    app.units.sensorInfoShow = function sensorInfoShow(sensorCounter, event, showUnitSensorLinks) {
        var
            isSensor = Number(sensorCounter.indicator.sId),
            labelData = {
                UNIT: '<span class="bold unit ' + (showUnitSensorLinks ? ' span_link_simple' : '') + '">' + _.unescape(app.units.listById[ sensorCounter.indicator.uId ].getName()) + '</span>'
            },
            updatedLastValue = sensorCounter.history.getLast();

        if (isSensor) {
            labelData.SENSOR = '<span class="sensor_counter bold' + (showUnitSensorLinks ? ' span_link_simple' : '') + '">' + sensorCounter.name + '</span>';
        }
        else {
            labelData.COUNTER = '<span class="unit ' + (showUnitSensorLinks ? ' span_link_simple' : '') + '">' + app.lang.counter_info_header_names[ sensorCounter.type ] + '</span>';
        }

        event && event.stopPropagation();
        app.units.currentSensor(sensorCounter);

        sensorCounter.val( sensorInfoGetValueToPrint_(sensorCounter) );
        sensorCounter.time( app.wialon.util.DateTime.formatTime(updatedLastValue.time, 2, app.user.currentUserDateTimeFormat) );

        $c_.sensor_info_label.html(
            isSensor ? app.lang.sensor_info_header(labelData) : app.lang.counter_info_header(labelData)
        );

        $c_.sensor_info_modal.modal();

        drawUnitSensorInfoGraph_();

        app.units.sensorInfoChangePeriod( app.history.DEFAULT_PERIOD );
    };

    /**
     * Click on sensor/counter info header counter/sensor or unit name
     * @param  {object} scope knockout scope
     * @param  {eventObject} event [description]
     */
    app.units.sensorCounterInfoHeaderClick = function sensorCounterInfoHeaderClick(scope, event) {
        var
            $target = app.$(event.target);

        if ( $target.hasClass('span_link_simple') ) {
            if ($target.hasClass('sensor_counter')) {
                app.units.showUnitSensorProperties(app.units.currentSensor());
            }
            else if ($target.hasClass('unit')) {
                app.units.unitWindowShow( app.units.listById[app.units.currentSensor().indicator.uId] );
            }
        }

        return true;
    };

    /*jshint unused: false */
(function example(a, b, c) {
    /* Don't use any of the arguments */
}());

    /**
     * Sensor Info Change Period for graph
     * @param  {string} period one of the app.history.periods
     * @param  {eventObject} event  event which generate this change
     */
    app.units.sensorInfoChangePeriod = function sensorInfoChangePeriod(period, event) {
        var
            currentSensor = app.units.currentSensor(),
            oldPeriod = currentSensor.history.period;

        if ( !app.units.sensorInfoCanViewPeriodData() ) {
            return false;
        }

        // if (period === oldPeriod) {
        //  event && event.stopImmediatePropagation() && event.preventDefault();
        //  return false;
        // }

        currentSensor.history.changePeriod(
            period,
            // onChangePeriod
            function() {
                currentSensor.period( period );
                app.units.sensorInfoPeriodOffset( app.units.currentSensor().history.periodOffset );
                app.units.sensorInfoPeriodText( currentSensor.history.getPeriodText() );
            },
            // onLoadData
            sensorInfoChangePeriodOffsetLoadDataHandler_
        );
    };

    /**
     * Handle click on plus icon in sensor info window, sensor period block
     */
    app.units.sensorInfoPeriodOffsetPlus = function sensorInfoPeriodOffsetPlus() {
        app.units.currentSensor().history.periodOffsetPlus(
            // onChangePeriod
            function() {
                app.units.currentSensor().period( app.units.currentSensor().history.period );
                app.units.sensorInfoPeriodText( app.units.currentSensor().history.getPeriodText() );
                app.units.sensorInfoPeriodOffset( app.units.currentSensor().history.periodOffset );
            },
            // onLoadData
            sensorInfoChangePeriodOffsetLoadDataHandler_
        );
    };

    /**
     * Handle click on minus icon in sensor info window, sensor period block
     */
    app.units.sensorInfoPeriodOffsetMinus = function sensorInfoPeriodOffsetMinus() {
        app.units.currentSensor().history.periodOffsetMinus(
            // onChangePeriod
            function() {
                app.units.currentSensor().period( app.units.currentSensor().history.period );
                app.units.sensorInfoPeriodText( app.units.currentSensor().history.getPeriodText() );
                app.units.sensorInfoPeriodOffset( app.units.currentSensor().history.periodOffset );
            },
            // onLoadData
            sensorInfoChangePeriodOffsetLoadDataHandler_
        );
    };

    if( ! app.langs || ! app.langs.translate){
        if( ! app.langs)
            app.langs = {};
        app.langs.translate = function(prop, name){
            if(arguments.length === 2)
                return (app.lang[prop] ? app.lang[prop][name] : false) || name || '--';
            else
                return (app.lang[prop] ? app.lang[prop] : false) || name || '--';
        };
    }

    return app;
})(sensolator || {});

// Desktops module
var sensolator = (function(app){
	'use strict';

	app.desktops = app.desktops || {};

	// ****************************
	// Private Properties & Methods
	// ****************************

	var
		pendingCachingElements_ = {
			desktop_list: '#desktop-list:first',
			desktops_list: '#desktops-list:first',
			desktops_prev: '#desktops-prev:first',
			desktops_next: '#desktops-next:first',
			desktops_dropdown_list: '#desktops-dropdown-list:first',
			desktop_select_file: '#desktop-select-file:first',
			remote_url_modal: '#remote-url-modal:first',
			page_bg_cached_imgs: '#page_bg #page_bg_cached_imgs',
			background_url_modal: '#background-url-modal:first'
			// also added bg_holder from BG_HOLDER
		},

		// DOM Constants
		DESKTOPS_LIST_ITEM_MIN_WIDTH_ = 50,
		DESKTOPS_LIST_ITEM_MAX_WIDTH_ = 93, // also init width from CSS; for container element
		DESKTOPS_LIST_ITEM_BORDER_X_TOTAL_WIDTH = 4, // left + right border width
		DESKTOPS_LIST_ITEM_MARGIN_X_TOTAL_WIDTH = 5, // left + right margin width
		DESKTOPS_LIST_ITEM_TEXT_MAX_WIDTH_ = 85, // text inside container

		COLOR_PICKER_ = '#colorpicker',
		GRIDSTER_ELEMENT_REMOTE_URL_TMPL_ = '#grid_remote_url_tmpl',

		// Skip the following fields when serialize watchSensors indicators
		serialize_indicator_fields_skip_ = [
			'metrics',
			'name',
			'sId',
			'uId',
			'val',
			'valid'
		],

		// Cached DOM elements, initialized from pendingCachingElements_ in units.initDOM()
		$c_ = {},

		widgetRemoteURLTmpl_,

		// Set button with loading animation, initialized in initDOM
		backgroundURLBtnSet_,
		// Wrapped in jQuery in initDOM
		backgroundURLImgLoader_ = new Image(),
		backgroundURLCachedImages_ = {},

		length_ = 0,
		lastId_ = 0,
		desktopBackgroundTypes_ = {
			map: {
				class: 'map',
				init: function() {
					var
						currentDesktop = app.desktops.listById[ app.desktops.currentId() ],
						mapState = currentDesktop.background.value();

					app.map.loadMap(mapState);

					currentDesktop.background.value( app.map.getMapState() );

					app.map.createUnitMarkers( app.units.list() );

					$c_.bg_holder.addClass(desktopBackgroundTypes_.map.class);
				},
				destroy: function() {
					// Save map state
					var
						mapState = app.map.getMapState();

					if (mapState) {
						app.desktops.listById[ app.desktops.currentId() ].background.value(mapState);
						app.desktops.listById[ app.desktops.currentId() ].backgroundInactive.map.value = mapState;

						app.map.destroy();
					}

					$c_.bg_holder.removeClass(desktopBackgroundTypes_.map.class);
				}
			},
			image: {
				class: 'image',
				init: function() {
					var
						currentDesktop = app.desktops.listById[ app.desktops.currentId() ],
						rawImageData = currentDesktop.background.value();

					if ( rawImageData && rawImageData !== 'none' && backgroundURLCachedImages_[rawImageData].img) {
						$c_.bg_holder.css('background-image', 'url("' + rawImageData + '")');
						// $c_.bg_holder.css('background-size', 'cover');
					}
					// OLD WAY WITHOUT URL
					// else {
					// 	if (currentDesktop.backgroundInactive.image.value) {
					// 		$c_.bg_holder.css('background-image', currentDesktop.backgroundInactive.image.value);
					// 	}
					// 	// See app.core.init method for loading file data
					// 	$c_.desktop_select_file.click();
					// }
					$c_.bg_holder.addClass(desktopBackgroundTypes_.image.class);
				},
				destroy: function() {
					app.desktops.listById[ app.desktops.currentId() ].backgroundInactive.image.value = app.desktops.listById[ app.desktops.currentId() ].background.value();
					$c_.bg_holder
						.css('background-image', '')
						.removeClass(desktopBackgroundTypes_.image.class);
				}
			},
			color: {
				class: 'color',
				init: function() {
					var
						newColor = app.desktops.listById[ app.desktops.currentId() ].background.value();

					$c_.bg_holder
						.css('background-color', newColor)
						.addClass(desktopBackgroundTypes_.color.class);
				},
				destroy: function() {
					app.desktops.listById[ app.desktops.currentId() ].backgroundInactive.color.value = $c_.bg_holder.css('background-color');
					$c_.bg_holder
						.css('background-color', '')
						.removeClass(desktopBackgroundTypes_.color.class);
				}
			}
		};

	var serializeDesktopDataClean_ = (function(){
		// TODO: use it to compare indicator with widget defatuls
		var comparator = function (srcObj, tmplObj) {
			var
				i;
			for (i in srcObj) {
				if (typeof srcObj[i] === 'object' || app.$.isArray(srcObj[i])) {
					if ( !comparator(srcObj[i], tmplObj[i]) ) {
						return false;
					}
				}
				else {
					if (!tmplObj || srcObj[i] !== tmplObj[i]) {
						return false;
					}
				}
			}
		};

		return function serializeDesktopDataClean_(desktopData) {
			var
				i,
				uId,
				sId,
				widget,
				types = ['watchSensors', 'watchCounters'];

			// process watchSensors & watchCounters
			for (i = types.length - 1; i > -1; i--) {
				for (uId in desktopData[ types[i] ]) {
					for (sId in desktopData[ types[i] ][uId]) {
						widget = desktopData[ types[i] ][uId][sId];
						if (!widget.onDesktop) {
							delete widget.gridster;
							// TODO: add more checks & cleanups
						}
					}
				}
			}
		};
	}());

	/**
	 * Desktop class
	 */
	var Desktop_ = (function(){
		var Desktop = function Desktop(newDesktopId) {
			this.id = newDesktopId;
			this.printName = ko.observable( app.lang.desktop_name_default({DESKTOP_ID: length_ + 1}) );
			this.backgroundInactive = {
				map: {
					value: {
						tileType: app.map.DEFAULT_TILE_TYPE
					}
				},
				image: {
					value: undefined
				},
				color: {
					value: app.desktops.DEFAULT_COLOR
				}
			};
			this.background = {
				type: ko.observable('color'),
				value: ko.observable( this.backgroundInactive.color.value )
			};
			this.remoteURLCollection = new RemoteURLCollection_();
		};

		Desktop.prototype.watchSensors = undefined;
		Desktop.prototype.watchCounters = undefined;
		Desktop.prototype.remoteURLs = undefined;

		return Desktop;
	}());

	/**
	 * Remote URL class
	 */
	var RemoteURLCollection_ = (function(){
		var
			WMOD_TRANSPARENT = 'wmode=transparent',

			remoteURLWidgetIdPrefix = 'ruw_',
			remoteURLWidgetOptions = {
				sizex: 3,
				sizey: 2,
				col: undefined,
				row: undefined,
				controls: [
					'delete',
					'options'
				]
			};

		var fixURL_ = function fixURL_(url) {
			var
				res = url.replace(/"/g, '%22'),
				purl = app.$.url(url),
				params = purl.param();

			res = app.utils.prependHTTP(res);

			if (!params.wmode || params.wmode !== 'transparent') {
				if ( url.indexOf(WMOD_TRANSPARENT) < 0 ) {
					if ( app._(params).keys().length ) {
						res += '&' + WMOD_TRANSPARENT;
					}
					else {
						res += '?' + WMOD_TRANSPARENT;
					}
				}
			}

			return res;
		};

		var drawWidget_ = function drawWidget_(data) {
			var
				srcURL = data.url,
				widgetHTML;

			data.url_to_print = app._.escape(data.url);
			data.url = fixURL_(data.url);
			sensolator.core.blockUnload.enabled = true;
			data.onload = function(){
				sensolator.core.blockUnload.enable();
			};

			widgetHTML = app._.template(widgetRemoteURLTmpl_, data, {variable: 'data'});
			data.url = srcURL;

			if (!data.props.controls) {
				data.props.controls = app.$.extend(true, {}, remoteURLWidgetOptions.controls);
			}

			app.gridster.add_widget.apply(
				app.gridster,
				[
					widgetHTML,
					data.props.sizex,
					data.props.sizey,
					data.props.col,
					data.props.row,
					undefined,
					data.props.controls
				]
			);
		};

		var RemoteURLCollection = function RemoteURLCollection() {
			this.lastId = 0;
			this.length = 0;
			this.listById = {};
		};

		RemoteURLCollection.prototype.addRemoteURL = function addRemoteURL(url) {
			var	data;

			url = app.$.trim( app.utils.stripHTTP(url) );

			if (!url) {
				return false;
			}

			++this.lastId;
			++this.length;

			// store data & options
			data = {
				id: remoteURLWidgetIdPrefix + this.lastId,
				props: app.$.extend(true, {}, remoteURLWidgetOptions),
				url: url
			};

			this.listById[ data.id ] = data;

			drawWidget_(data);
		};

		RemoteURLCollection.prototype.removeRemoteURL = function removeRemoteURL(remoteURLId) {
			if ( !this.listById[remoteURLId] ) {
				return false;
			}

			app.gridster.remove_widget( app.core.$c.grid_cont.find('#' + remoteURLId) );

			delete this.listById[remoteURLId];
			--this.length;
		};

		RemoteURLCollection.prototype.editRemoteURL = function editRemoteURL(remoteURLId, newURL) {
			var
				$remoteURLContainer;

			newURL = app.$.trim( app.utils.stripHTTP(newURL) );

			if ( !this.listById[remoteURLId] || !newURL || newURL === this.listById[remoteURLId].url) {
				return false;
			}

			this.listById[remoteURLId].url = newURL;

			$remoteURLContainer = app.core.$c.grid_cont.find('#' + remoteURLId);

			$remoteURLContainer.find('div.grid_remote_url_header:first').children('span:first').html(newURL);
			$remoteURLContainer.find('iframe:first').attr('src', fixURL_(newURL));
			app.core.blockUnload.enable();
		};

		RemoteURLCollection.prototype.saveAllWidgetStates = function saveAllWidgetStates() {
			var
				widgetID,
				$widget;

			for (widgetID in this.listById) {
				$widget = app.core.$c.grid_cont.find('#' + widgetID);

				if ($widget.length) {
					this.listById[ widgetID ].props.sizex = $widget.attr('data-sizex');
					this.listById[ widgetID ].props.sizey = $widget.attr('data-sizey');
					this.listById[ widgetID ].props.row = $widget.attr('data-row');
					this.listById[ widgetID ].props.col = $widget.attr('data-col');
				}
			}
		};

		RemoteURLCollection.prototype.restoreAllWidgets = function restoreAllWidgets() {
			var
				i;

			for (i in this.listById) {
				drawWidget_( this.listById[i] );
			}
		};

		return RemoteURLCollection;
	}());

	/**
	 * Check desktops list buttons prev/next need and state (active or disabled)
	 */
	var desktopButtonsPrevNextCheck_ = function desktopButtonsPrevNextCheck_(){
		var
			activeClass = 'active',
			viewboxRect = $c_.desktops_list[0].getBoundingClientRect(),
			$desktopButtons = $c_.desktops_list.children(),
			$firstD = $desktopButtons.first(),
			$lastD = $desktopButtons.last(),
			showButtons = false;

		// Check prev button
		if ($firstD[0].getBoundingClientRect().left < viewboxRect.left)	{
			$c_.desktops_prev.addClass(activeClass);
			showButtons = true;
		}
		else {
			$c_.desktops_prev.removeClass(activeClass);
		}

		// Check next button
		if ($lastD[0].getBoundingClientRect().right > viewboxRect.right)	{
			$c_.desktops_next.addClass(activeClass);
			showButtons = true;
		}
		else {
			$c_.desktops_next.removeClass(activeClass);
		}

		if (showButtons) {
			$c_.desktops_prev.css('visibility') === 'hidden' && $c_.desktops_prev.css('visibility', 'visible');
			$c_.desktops_next.css('visibility') === 'hidden' && $c_.desktops_next.css('visibility', 'visible');
		}
		else {
			$c_.desktops_prev.css('visibility') === 'visible' && $c_.desktops_prev.css('visibility', 'hidden');
			$c_.desktops_next.css('visibility') === 'visible' && $c_.desktops_next.css('visibility', 'hidden');
		}
	};

	/**
	 * Desktops list viewbox center current desktop; throttled
	 */
	var currentDesktopToViewboxCenter_ = _.throttle(
		function currentDesktopToViewboxCenter_(){
			var
				viewboxRect,
				viewboxCenterX,
				viewboxDMinX,
				viewboxDMaxX,
				$desktopButtons = $c_.desktops_list.children(),
				$firstD = $desktopButtons.first(),
				$lastD,
				lastDRect,
				$currentD = $desktopButtons.filter('.active'),
				currentDRect,
				currentDCenterX,
				lastOffset = parseInt($firstD.css('margin-left'), 10),
				fitOffset = 0;

			!lastOffset && (lastOffset = 0);

			if (!$currentD.length || $firstD[0] === $currentD[0]) {
				lastOffset && $firstD.css('margin-left', fitOffset);
			}
			else {
				currentDRect = $currentD[0].getBoundingClientRect();
				currentDCenterX = Math.round(currentDRect.left + currentDRect.width / 2 - lastOffset);

				$lastD = $desktopButtons.last();
				lastDRect = $lastD[0].getBoundingClientRect();

				viewboxRect = $c_.desktops_list[0].getBoundingClientRect();
				viewboxCenterX = Math.round(viewboxRect.left + viewboxRect.width / 2);
				if (currentDRect.width >= viewboxRect.width) {
					viewboxDMinX = viewboxCenterX;
					viewboxDMaxX = viewboxCenterX;
				}
				else {
					viewboxDMinX = Math.round(viewboxRect.left + currentDRect.width / 2 - lastOffset);
					viewboxDMaxX = Math.round(viewboxRect.right - currentDRect.width / 2 - lastOffset);
				}

				if (currentDCenterX > viewboxCenterX) {
					fitOffset = currentDCenterX - viewboxCenterX;
					if (lastDRect.right - fitOffset - lastOffset < viewboxRect.right) {
						fitOffset = lastDRect.right - lastOffset - viewboxRect.right;
					}
					$firstD.css('margin-left', -fitOffset);
				}
				else {
					$firstD.css('margin-left', 0);
				}
			}

			desktopButtonsPrevNextCheck_();
		},
		500
	);

	// ***************************
	// Public Properties & Methods
	// ***************************

	app.desktops.MAX_DESKTOP_COUNT = 10;
	app.desktops.MAX_DESKTOP_NAME_LENGTH = 50,

	app.desktops.list = ko.observableArray([]);
	app.desktops.listById = {};

	app.desktops.BG_HOLDER = '#page_bg',

	app.desktops.DEFAULT_COLOR = '#fff';

	app.desktops.currentId = ko.observable(0);
	app.desktops.current = ko.computed(function(){
		var
			current = app.desktops.listById[ app.desktops.currentId() ];

		if (current) {
			return current;
		}

		return {
			background: {
				type: function(){ return '';},
				value: function(){ return '';}
			}
		};
	});

	app.desktops.isDesktopNameValid = ko.observable(true);

	/**
	 * Desktop buttons prev/next click handling
	 * @param  {object} scope knockout scope
	 * @param  {object} event jQuery event object
	 */
	app.desktops.desktopsButtonsPrevNextClick = function desktopsButtonsClick(scope, event){
		var
			$target = app.$(event.target),
			$firstD = $c_.desktops_list.children(':first'),
			$lastD,
			lastDRect,
			currentOffset = Math.abs(parseInt( $firstD.css('margin-left'), 10 ) || 0),
			newOffset = 0,
			viewboxRect = $c_.desktops_list[0].getBoundingClientRect(),
			viewboxMargin = parseInt( $c_.desktops_list.css('margin-right') || 0, 10);

		if ($target.hasClass('active')) {
			if (event.target === $c_.desktops_prev[0]) {
				// scroll left
				if (currentOffset > viewboxRect.width - viewboxMargin) {
					newOffset = currentOffset - viewboxRect.width - viewboxMargin;
				}
			}
			else if (event.target === $c_.desktops_next[0]) {
				// scroll right
				$lastD = $c_.desktops_list.children(':last');
				lastDRect = $lastD[0].getBoundingClientRect();
				if (viewboxRect.right + viewboxRect.width - viewboxMargin < lastDRect.right) {
					newOffset = currentOffset + viewboxRect.width + viewboxMargin;
				}
				else {
					newOffset = currentOffset + lastDRect.right - viewboxRect.right;
				}
			}

			$firstD.css('margin-left', -newOffset);
			desktopButtonsPrevNextCheck_();
		}
	};

	/**
	 * Fix desktops list width when window resized or desktop added/deleted; throttled
	 */
	app.desktops.fixDesktopsListWidth = _.throttle(
		function fixDesktopsListWidth(runOnce){
			$c_.desktops_list.css('width', 'auto');
			$c_.desktops_list.children(':first').css('margin-left', 0);

			var
				extra = DESKTOPS_LIST_ITEM_BORDER_X_TOTAL_WIDTH + DESKTOPS_LIST_ITEM_MARGIN_X_TOTAL_WIDTH,
				header = app.core.$c.header[0],
				overflowWidth = $c_.desktop_list.outerWidth(true) - header.offsetWidth,
				desktopsListWidth = $c_.desktops_list.outerWidth(),
				desktopsListFixedWidth,
				currentItemWidth,
				fitItemWidth,
				newItemWidth,
				needRefix = false;

			if (overflowWidth > 0) {
				// squeeze
				currentItemWidth = desktopsListWidth / length_ - extra;
				fitItemWidth = Math.floor( (desktopsListWidth - overflowWidth) / length_ - extra );

				if (currentItemWidth > DESKTOPS_LIST_ITEM_MIN_WIDTH_) {
					if (fitItemWidth > DESKTOPS_LIST_ITEM_MIN_WIDTH_) {
						newItemWidth = fitItemWidth;
					}
					else {
						newItemWidth = DESKTOPS_LIST_ITEM_MIN_WIDTH_;
					}
				}

				if (fitItemWidth < DESKTOPS_LIST_ITEM_MIN_WIDTH_) {
					// show scrolling buttons
					desktopsListFixedWidth = desktopsListWidth - overflowWidth;
					$c_.desktops_list.outerWidth(desktopsListFixedWidth);
				}
			}
			else {
				// stretch
				newItemWidth = DESKTOPS_LIST_ITEM_MAX_WIDTH_;
				!runOnce && (needRefix = true);
			}

			if (newItemWidth) {
				$c_.desktops_list.find('.desktop-nav-btn').each(function(){
					var
						$this = app.$(this);

					$this.outerWidth(newItemWidth);
					$this.children('div:first').outerWidth(newItemWidth - (DESKTOPS_LIST_ITEM_MAX_WIDTH_ - DESKTOPS_LIST_ITEM_TEXT_MAX_WIDTH_));
				});
			}

			needRefix && fixDesktopsListWidth(true);

			currentDesktopToViewboxCenter_();
		},
		30
	);

	// desktop's Id that we editing printName, 0 if no desktop name we editing
	// subscribe on change editId and save the app state only if actual desktop name changed
	app.desktops.editId = ko.observable(0).subscribe((function(){
		var
			editDesktopId,
			prevDesktopName;

		return function(desktopId){
			var
				newDesktopName;

			if (desktopId) {
				editDesktopId = desktopId;
				prevDesktopName = app.desktops.listById[desktopId].printName();
			}
			else {
				app._.defer(function(){
					newDesktopName = app.desktops.listById[editDesktopId].printName();
					if (prevDesktopName !== newDesktopName) {
						if (app.desktops.isDesktopNameValid()) {
							app.core.appStateSave();
						}
						else {
							// invalid name, then restore previous name
							app.desktops.listById[editDesktopId].printName(prevDesktopName);
							app.desktops.isDesktopNameValid(true);
						}
					}
					editDesktopId = null;
					prevDesktopName = null;
				});
			}
		};
	}())).target;

	// Remote URL (iframe) observables
	app.desktops.remoteURLInputData = ko.observable('');
	app.desktops.remoteURLEditId = ko.observable(false);

	// Background URL observables
	app.desktops.backgroundURLInputData = ko.observable('');

	/**
	 * Init desktops module, called in core.init before domReady
	 */
	app.desktops.init = function() {

	};

	/**
	 * Init desktops DOM elements, called in core.startApp
	 */
	app.desktops.initDOM = function initDOM() {
		var
			e,
			WIDGET_REMOTE_URL = '.grid_remote_url',
			WIDGET_BTN_DELETE = 'gs-delete',
			WIDGET_BTN_OPTIONS = 'gs-options',
			onChangeColor = function(color, bool) {
				app.desktops.changeBackground('color', bool ? color : color.toHexString());
			};

		// Cache commonly used elements
		for (e in pendingCachingElements_) {
			$c_[e] = app.$( pendingCachingElements_[e] );
		}

		$c_['bg_holder'] = app.$( app.desktops.BG_HOLDER );

		// Background URL vars
		backgroundURLBtnSet_ = Ladda.create( $c_.background_url_modal.find('.ladda-button:first')[0] );
		backgroundURLImgLoader_ = app.$(backgroundURLImgLoader_)
			.load(function () {
				var
					url = app.$(this).attr('src'),
					BG_TYPE = 'image',
					currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

				if ( currentDesktop.background.type() !== BG_TYPE ) {
					desktopBackgroundTypes_[ currentDesktop.background.type() ].destroy();
					currentDesktop.background.type( BG_TYPE );
				}

				$c_.background_url_modal.modal('hide');
				backgroundURLBtnSet_.stop();

				// cache that image
				if ( !backgroundURLCachedImages_[url] ) {
					backgroundURLCachedImages_[url] = {
						desktops: {},
						desktopsCount: 1,
						img: app.$(new Image()).attr('src', url)
					};
					backgroundURLCachedImages_[url].desktops[ currentDesktop.id ] = true;
					$c_.page_bg_cached_imgs.append( backgroundURLCachedImages_[url].img );
				}
				else {
					if ( !backgroundURLCachedImages_[url].desktops[ currentDesktop.id ] ) {
						backgroundURLCachedImages_[url].desktops[ currentDesktop.id ] = true;
						++backgroundURLCachedImages_[url].desktopsCount;
					}
				}

				currentDesktop.background.value(url);
				desktopBackgroundTypes_[ BG_TYPE ].init();
				app.core.appStateSave();
			})
			.error(function () {
				backgroundURLBtnSet_.stop();

				if ( app.$(this).attr('src') ) {
					app.core.errorMessage(null, app.lang.errors.invalid_image_url);
					$c_.background_url_modal.find('input:text:visible:first').focus();
				}
			});

		widgetRemoteURLTmpl_ = app.$(GRIDSTER_ELEMENT_REMOTE_URL_TMPL_).html();

		// Select file for desktop background OLD WAY WITHOUT URL
		// TODO: delete this
		// $c_.desktop_select_file.change(function(event){
		// 	var
		// 		self = this,
		// 		file = event.target.files[0],
		// 		reader = new FileReader();

		// 	if (file && file.type.match('image.*') ) {
		// 		reader.onload = (function(file){
		//					return function(e) {
		//						var
		//							rawBgImgStyle = 'url(' + e.target.result +')';

		// 					app.desktops.listById[ app.desktops.currentId() ].background.value( rawBgImgStyle );
		// 					$c_.bg_holder.css({
		//					'background-image': rawBgImgStyle
		//					});

		//           // app.core.appStateSave();


		//         }
		//     })(file);

		//     reader.readAsDataURL(file);
		// 	}
		// });

		// Select background url for desktop: Open/Hide
		$c_.background_url_modal
			// Focus on first input when popup is shown
			.on('shown.bs.modal', function () {
				$c_.background_url_modal.find('input:text:visible:first').focus();
			})
			// Cancel add remote URL
			.on('hidden.bs.modal', function(event){
				app.desktops.backgroundURLInputData('');
				backgroundURLImgLoader_.attr('src', '');
			});

		// Save remote URL modal on Enter keyup of any input
		$c_.background_url_modal.on('keyup', 'input', function(event){
			// Enter key
			if (event.which === 13) {
				$c_.background_url_modal.find('#background-url-modal-button-set:enabled:first').click();
			}
		});

		// Select color for desktop background
		/* global getPalette */
		app.$(COLOR_PICKER_).spectrum({
				preferredFormat: 'hex',
				showButtons: 0,
				showInput: 1,
				showPalette: 1,
				showSelectionPalette: 0,
				palette: getPalette(),
				containerClassName: 'bg-colorpicker',
				change: onChangeColor,
				move: onChangeColor,
				beforeShow: function(color) {
					var currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

					if (currentDesktop.background.type() !== 'color') {
						color = currentDesktop.backgroundInactive.color.value || app.desktops.DEFAULT_COLOR;
						app.$(this).spectrum('set', color);

						if (currentDesktop.backgroundInactive.color.value) {
							onChangeColor(color, true);
							return false;
						}
					}
				},
				show: function() {
					var
						currentDesktop = app.desktops.listById[ app.desktops.currentId() ],
						color;

					if (currentDesktop.background.type() === 'color') {
						color = currentDesktop.background.value();
					}
					else {
						color = currentDesktop.backgroundInactive.color.value;
					}
					if (!color) {
						color = app.desktops.DEFAULT_COLOR;
					}
					app.$(this).spectrum('set', color);
				}
			});

		// Open/Hide add remote URL modal
		$c_.remote_url_modal
			// Focus on first input when popup is shown
			.on('shown.bs.modal', function () {
				$c_.remote_url_modal.find('input:text:visible:first').focus();
			})
			// Cancel add remote URL
			.on('hidden.bs.modal', function(event){
				app.desktops.remoteURLInputData('');
				app.desktops.remoteURLEditId(false);
			});

		// Save remote URL modal on Enter keyup of any input
		$c_.remote_url_modal.on('keyup', 'input', function(event){
			// Enter key
			if (event.which === 13) {
				$c_.remote_url_modal.find('button.btn-success:enabled').click();
			}
		});

		// Remote URL widget options & delete
		app.core.$c.grid_cont.on(
			{
				'mousedown.sensolator': function(event) {
					var
						$this = app.$(this),
						widgetID = $this.closest(WIDGET_REMOTE_URL).attr('id'),
						currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

					// Determine the action
					if ( $this.hasClass(WIDGET_BTN_DELETE) ) {
						currentDesktop.remoteURLCollection.removeRemoteURL( widgetID );
						app.core.appStateSave();
					}
					else if ( $this.hasClass(WIDGET_BTN_OPTIONS) ) {
						app.desktops.remoteURLShowEdit( widgetID );
					}

					return false;
				}
			},
			WIDGET_REMOTE_URL + ' .' + WIDGET_BTN_DELETE + ',' +
				WIDGET_REMOTE_URL + ' .' + WIDGET_BTN_OPTIONS
		);
		app.core.$c.grid_cont.on({
			'click.sensolator': function(event) {
				if ( !event.ctrlKey ) {
					return true;
				}

				var
					$this = app.$(this),
					widgetID = $this.closest(WIDGET_REMOTE_URL).attr('id'),
					currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

				currentDesktop.remoteURLCollection.removeRemoteURL( widgetID );

				app.core.appStateSave();

				return false;
			}
		}, WIDGET_REMOTE_URL);

		// Catch keydown on desktops list container
		$c_.desktops_list.on({
			'keydown': function(event){
				event.stopPropagation();

				// Enter key || Esc key
				if (event.which === 13 || event.which === 27) {
					app.desktops.editId(0);
				}
			}
		});
		// Show title only when text-overflow is active
		/* global isTextOverflowActive */
		$c_.desktops_list.on({
			'mouseenter.overflowedTitle': function(event){
				var
					$this = $(this),
					$desktopNameHolder = $this.find('div:first'),
					prevTitle = $this.attr('title'),
					newTitle = $desktopNameHolder.text();

				if (isTextOverflowActive($desktopNameHolder[0])) {
					if (prevTitle !== newTitle) {
						$this.attr('title', newTitle );
					}
				}
				else {
					if (prevTitle) {
						$this.removeAttr('title');
					}
				}

				return true;
			}
		}, '.desktop-nav-btn');

		// Show title only when text-overflow is active
		$c_.desktops_dropdown_list.on({
			'mouseenter.overflowedTitle': function(event){
				var
					$this = $(this),
					$holder = $this.find('span:first'),
					prevTitle = $this.attr('title'),
					newTitle = $holder.text();

				if (isTextOverflowActive($holder[0])) {
					if (prevTitle !== newTitle) {
						$this.attr('title', newTitle );
					}
				}
				else {
					if (prevTitle) {
						$this.removeAttr('title');
					}
				}

				return true;
			}
		}, 'span.name');
	};

	/**
	 * Init handler on wialon loaded event
	 * here it initialized desktop(s)
	 */
	app.desktops.initOnWialonLoaded = function initOnWialonLoaded() {

	};

	/**
	 * Serialize the module
	 * @return {object} moduleState object, to restore module use unserialize(moduleState)
	 */
	app.desktops.serialize = function serialize() {
		var
			i,
			j,
			uId,
			sId,
			sensor,
			desktopId,
			currentId = app.desktops.currentId(),
			res = {
				currentId: currentId,
				listById: {},
				length_: length_,
				lastId_: lastId_
			},
			types = ['watchSensors', 'watchCounters'];

		// save gridster unit options
		app.units.updateGridsterPositionModel();
		// save remote URL collection
		app.desktops.listById[ currentId ].remoteURLCollection.saveAllWidgetStates();
		// save map state
		if ( app.desktops.listById[ currentId ].background.type() === 'map' ) {
			app.desktops.listById[ currentId ].background.value( app.map.getMapState() );
		}

		for (desktopId in app.desktops.listById) {
			// save base simple properties
			res.listById[desktopId] = {
				background: app.utils.extendKo({}, app.desktops.listById[desktopId].background),
				backgroundInactive: app.utils.extendKo({}, app.desktops.listById[desktopId].backgroundInactive),
				id: app.desktops.listById[desktopId].id,
				printName: app.desktops.listById[desktopId].printName(),
				remoteURLCollection: {},
				watchSensors: {},
				watchCounters: {}
			};

			// save remoteURLCollection
			res.listById[desktopId].remoteURLCollection = app.utils.extendKo({}, app.desktops.listById[ desktopId ].remoteURLCollection);
			for (i in res.listById[desktopId].remoteURLCollection.listById) {
				delete res.listById[desktopId].remoteURLCollection.listById[i].url_to_print;
				delete res.listById[desktopId].remoteURLCollection.listById[i].props.controls;
			}

			// save watch items (sensors|counters)
			for (i = types.length - 1; i > -1; i--) {
				for (uId in app.desktops.listById[ desktopId ][ types[i] ]) {
					res.listById[desktopId][ types[i] ][uId] = {};
					for (sId in app.desktops.listById[ desktopId ][ types[i] ][uId]) {
						sensor = app.desktops.listById[ desktopId ][ types[i] ][uId][sId];
						var diff = this.isChangedSensor(sId, uId, sensor.indicator, types[i], sensor.onDesktop);
						if(!diff.state){
							continue;
						}

						res.listById[desktopId][ types[i] ][uId][sId] = {
							gridster: app.utils.extendKo({}, sensor.gridster),
							indicator: app.utils.extendKo({}, diff.data),
							onDesktop: sensor.onDesktop
							// period: ko.isObservable(sensor.period) ? sensor.period() : sensor.period
						};

						delete res.listById[desktopId][ types[i] ][uId][sId].gridster.controls;

						// delete unnecessary fields
						for (j = serialize_indicator_fields_skip_.length - 1; j > -1; j--) {
							delete res.listById[desktopId][ types[i] ][uId][sId].indicator[ serialize_indicator_fields_skip_[j] ];
						}
					}

					if(Object.keys(res.listById[desktopId][ types[i] ][uId]).length === 0){
						delete res.listById[desktopId][ types[i] ][uId];
					}
				}
			}

			serializeDesktopDataClean_(res.listById[desktopId]);
		}

		return res;
	};

	app.desktops.isChangedSensor = function(sensorId, unitId, currentState, type, allowSave){
		var currState = app.utils.extendKo({}, currentState);
		var unit = app.units.listById[unitId];
		if(!unit){
			return {state: 0, data: {}};
		}
		var sensorsInfo = unit.getSensors();
		if(!sensorsInfo[sensorId])
			sensorsInfo[sensorId] = {};
		var k;
		var indicatorDefault = {};
		var isDiff = 0;

		if(type === 'watchCounters'){

			var metrics = app._(app.lang.measure_units).clone();
			metrics['Mileage'] = app.lang.measure_units['Mileage'][unit.getMeasureUnits()];

			indicatorDefault = {
				sId: sensorId, // sensor ID
				uId: unitId, // unit ID
				skin: app.units.defaultSensor.DEFAULT_SENSOR_SKIN_,
				min: app.units.defaultSensor.DEFAULT_SENSOR_MIN_,
				max: app.units.defaultSensor.DEFAULT_SENSOR_MAX_,
				fit: app.units.defaultSensor.DEFAULT_SENSOR_FIT_,
				name: app.lang.counters[sensorId],
				metrics: metrics[sensorId],
				show_unit_name: app.units.defaultSensor.DEFAULT_SENSOR_SHOW_UNIT_NAME_,
				show_sensor_name: app.units.defaultSensor.DEFAULT_SENSOR_SHOW_SENSOR_NAME_,
				show_axes: app.units.defaultSensor.DEFAULT_SENSOR_SHOW_AXES_,
				round: app.units.defaultSensor.DEFAULT_SENSOR_ROUND_VALUE_,
				bg_image: '',
				color_1: app.units.defaultSensor.DEFAULT_SENSOR_COLOR_1_,
				color_2: app.units.defaultSensor.DEFAULT_SENSOR_COLOR_2_,
				color_3: app.units.defaultSensor.DEFAULT_SENSOR_COLOR_3_,
                scheme: app.units.defaultSensor.DEFAULT_SENSOR_SCHEME_
			};
		}else{
			indicatorDefault = {
				sId: sensorId, // sensor ID
				uId: unitId*1, // unit ID
				skin: app.units.defaultSensor.DEFAULT_SENSOR_SKIN_,
				min: app.units.defaultSensor.DEFAULT_SENSOR_MIN_,
				max: app.units.defaultSensor.DEFAULT_SENSOR_MAX_,
				fit: app.units.defaultSensor.DEFAULT_SENSOR_FIT_,
				name: sensorsInfo[sensorId].n,
				metrics: sensorsInfo[sensorId].m,
				show_unit_name: app.units.defaultSensor.DEFAULT_SENSOR_SHOW_UNIT_NAME_,
				show_sensor_name: app.units.defaultSensor.DEFAULT_SENSOR_SHOW_SENSOR_NAME_,
				show_axes: app.units.defaultSensor.DEFAULT_SENSOR_SHOW_AXES_,
				round: app.units.defaultSensor.DEFAULT_SENSOR_ROUND_VALUE_,
				bg_image: '',
				color_1: app.units.defaultSensor.DEFAULT_SENSOR_COLOR_1_,
				color_2: app.units.defaultSensor.DEFAULT_SENSOR_COLOR_2_,
				color_3: app.units.defaultSensor.DEFAULT_SENSOR_COLOR_3_,
                scheme: app.units.defaultSensor.DEFAULT_SENSOR_SCHEME_
			};
		}

		// exists scheme into widget
		var _skin = currentState.skin;
		if ( app.units.sensorSkins[_skin] && !app.units.sensorSkins[_skin].scheme ) {
			delete indicatorDefault.scheme;
		}

		for(k in currState){
			if(indicatorDefault[k] === undefined){
				delete currState[k];
			}
		}

		var diff = {};

		for(k in indicatorDefault){
			if(indicatorDefault[k] !== currState[k]){
				isDiff = 1;
				diff[k] = currState[k];
			}
		}

		if( allowSave){
			return {state: 1, data: diff};
		}

		return {state: isDiff, data: diff};
	};

	/**
	 * Desktop (html -> body) keyDown handler
	 * @param  {?scope} scope knockout scope
	 * @param  {object} event object containing event data
	 */
	app.desktops.onKeyDown = _(function onKeyDown(scope, event) {
		var
			i,
			currentDesktop = app.desktops.current(),
			desktops = app.desktops.list() || [],
			currentDesktopIndex,
			switchToDesktopIndex,
			keyCode = (typeof event.which === 'number') ? event.which : event.keyCode,
			numberCode = Number(String.fromCharCode(keyCode)) || (keyCode > 96 && keyCode <= 105 ? keyCode - 96 : false);

		if (desktops.length > 1) {
			// Distinguish our needed keys
			if (numberCode && numberCode <= app.desktops.list().length && !app.core.$c.page_container.children('div.modal.in:first').length) {
				app.desktops.changeDesktopTo( app.desktops.list()[numberCode - 1].id );
			}
			else if (event.ctrlKey && (keyCode === 37 || keyCode === 39)) {
				// Find current desktop index
				for (i = desktops.length; i > -1; i--) {
					if (desktops[i] === currentDesktop) {
						currentDesktopIndex = i;
						break;
					}
				}

				if (keyCode === 37) {
					// Previous
					switchToDesktopIndex = (currentDesktopIndex ? currentDesktopIndex : desktops.length) - 1;
				}
				else if (keyCode === 39) {
					// Next
					switchToDesktopIndex = (currentDesktopIndex === desktops.length - 1) ? 0 : currentDesktopIndex + 1;
				}

				if (typeof switchToDesktopIndex !== 'undefined') {
					app.desktops.changeDesktopTo( desktops[switchToDesktopIndex].id );
					// Return false to prevent map bg from changing the viewbox
					return false;
				}
			}
		}

		return true;
	}).throttle(100);

	/**
	 * Restore module state
	 * @param  {object} moduleState object returned from serialize()
	 */
	app.desktops.unserialize = function unserialize(moduleState) {
		var
			// units = app.units.list(),
			preloadingImgs = {},
			desktopImgURL,
			desktopId,
			currentId;

		if (!moduleState.length_) {
			app.desktops.createDesktop();
			return;
		}

		for (desktopId in moduleState.listById) {
            var data = moduleState.listById[desktopId];
            if ( data.watchCounters ) {
                for (var countersId in data.watchCounters) {
                    for (var counterId in data.watchCounters[countersId]) {
                        if (_.isObject(data.watchCounters[countersId][counterId].indicator.scheme)) {
                            data.watchCounters[countersId][counterId].indicator.scheme = _.values(data.watchCounters[countersId][counterId].indicator.scheme);
                        }
                    }
                }
            }
            if ( data.watchSensors ) {
                for (var sensorsId in data.watchSensors) {
                    for (var sensorId in data.watchSensors[sensorsId]) {
                        if (_.isObject(data.watchSensors[sensorsId][sensorId].indicator.scheme)) {
                            data.watchSensors[sensorsId][sensorId].indicator.scheme = _.values(data.watchSensors[sensorsId][sensorId].indicator.scheme);
                        }
                    }
                }
            }

			app.desktops.createDesktop();
			app.desktops.listById[ app.desktops.currentId() ] = app.utils.extendKo(app.desktops.listById[ app.desktops.currentId() ], data);
			app.desktops.listById[ app.desktops.currentId() ].id = app.desktops.currentId();

			/* jshint eqeqeq:false */
			if ( desktopId == moduleState.currentId ) {
				currentId = app.desktops.currentId();
			}

			// Preload images
			desktopImgURL = ( app.desktops.listById[ app.desktops.currentId() ].background.type() === 'image' && app.desktops.listById[ app.desktops.currentId() ].background.value() ) || app.desktops.listById[ app.desktops.currentId() ].backgroundInactive.image.value;
			if (desktopImgURL) {
				if ( !backgroundURLCachedImages_[desktopImgURL] ) {
					backgroundURLCachedImages_[desktopImgURL] = {
						desktops: {},
						desktopsCount: 0,
						img: false
					};

					preloadingImgs[desktopImgURL] = app.$(new Image())
						.load(function(){
							var
								currentDesktop = app.desktops.listById[ app.desktops.currentId() ],
								url = app.$(this).attr('src');

							backgroundURLCachedImages_[url].img = app.$(new Image()).attr('src', url);

							$c_.page_bg_cached_imgs.append( backgroundURLCachedImages_[url].img );

							if ( currentDesktop.background.type() === 'image' && currentDesktop.background.value() === url ) {
								desktopBackgroundTypes_.image.init();
							}
						})
						.error(function(){
							var
								url = app.$(this).attr('src');

							if (url) {
								app.core.errorMessage(undefined, app.lang.errors.invalid_image_url_on_page_load + url);
							}
						})
						.attr('src', desktopImgURL);
				}
				backgroundURLCachedImages_[desktopImgURL].desktops[ app.desktops.currentId() ] = true;
				++backgroundURLCachedImages_[desktopImgURL].desktopsCount;
			}
		}

		app.desktops.currentId(currentId);

		// if ( app.desktops.listById[currentId].background.type() !== 'image' ) {
		// 	desktopBackgroundTypes_[ app.desktops.listById[currentId].background.type() ].init();
		// }
	};

	/**
	 * Create new desktop
	 * @param  {?string} background.type new background type
	 * @param  {?object} background.value new background init value
	 * @param  {[type]} editName   whether to set edit
	 * @return {boolean}            true on success, false otherwise
	 */
	app.desktops.createDesktop = function createDesktop(background) {
		var
			oldDesktop = app.desktops.currentId() ? app.desktops.listById[ app.desktops.currentId() ] : false,
			oldBG = oldDesktop ? oldDesktop.background : false,
			newId = lastId_+1,
			newDesktop = new Desktop_(newId);

		if (length_ === app.desktops.MAX_DESKTOP_COUNT) {
			return false;
		}

		if (oldDesktop) {
			oldDesktop.remoteURLCollection.saveAllWidgetStates();
			desktopBackgroundTypes_[ oldBG.type() ].destroy();
		}

		// Clear existing watch sensors and remove all widgets
		app.units.clearWatchItemsPanel();

		// Inner model
		app.desktops.listById[ newId ] = newDesktop;

		// Take the link of new watchSensors
		newDesktop.watchSensors = app.units.watchSensors;
		newDesktop.watchCounters = app.units.watchCounters;

		// Update id & length
		++lastId_;
		++length_;
		app.desktops.currentId( lastId_ );

		// Init background
		if (background) {
			newDesktop.background.type( background.type );
			newDesktop.background.value( background.value );
		}

		desktopBackgroundTypes_[ newDesktop.background.type() ].init( newDesktop.background.value() );

		// Store desktop
		app.desktops.list.push( newDesktop );

		app._.defer(app.desktops.fixDesktopsListWidth);

		app.core.appStateSave();
		app.reports.minimizeReport();
		return true;
	};

	/**
	 * Copy desktop
	 * @param  {int]} desktopId source desktop Id to copy
	 */
	app.desktops.copyDesktop = function copyDesktop(desktopId) {
		var	newDesktopId;

		app.desktops.createDesktop();
		newDesktopId = app.desktops.currentId();

		// Create observables in watchSensors & watchCounters
		app.units.recalcAllUnitsImmediate();

		app.desktops.listById[newDesktopId] = app.utils.extendKo(app.desktops.listById[newDesktopId], app.desktops.listById[desktopId]);
		app.desktops.listById[newDesktopId].id = newDesktopId;

		desktopBackgroundTypes_[ app.desktops.listById[newDesktopId].background.type() ].init();

		app.units.createAllWidgets();

		app.core.appStateSave();
	};

	/**
	 * Change background of current desktop
	 * @param  {string} backgroundType background type to change to
	 * @param  {object} value          background value to assign to this background
	 */
	app.desktops.changeBackground = function changeBackground(backgroundType, value) {
		var
			currentDesktop = app.desktops.listById[ app.desktops.currentId() ],
			newBackgroundType,
			newBackgroundValue;

		// The same background type
		if (backgroundType === currentDesktop.background.type()) {
			switch (backgroundType) {
				case 'map':
					newBackgroundValue = app.$.extend({}, currentDesktop.backgroundInactive.map.value || {}, currentDesktop.background.value() || {}, app.map.getMapState(), value);
					break;
				case 'color':
					if (value === currentDesktop.background.value()) {
						return;
					}
					else {
						newBackgroundValue = value || currentDesktop.backgroundInactive[ backgroundType ].value;
					}
					break;
				case 'image':
					newBackgroundValue = value;
					break;
			}
		}
		// New background type
		else {
			newBackgroundType = backgroundType;
			newBackgroundValue = currentDesktop.backgroundInactive[ backgroundType ].value;
		}

		if ( (newBackgroundType === 'image' && !newBackgroundValue) || (!newBackgroundType && !newBackgroundValue) ) {
			app.desktops.backgroundURLShow();
		}
		else {
			desktopBackgroundTypes_[ currentDesktop.background.type() ].destroy();

			if (newBackgroundType) {
				currentDesktop.background.type( newBackgroundType );
			}

			currentDesktop.background.value( newBackgroundValue );
			desktopBackgroundTypes_[ backgroundType ].init();

			app.core.appStateSave();
		}
	};

	/**
	 * Handler for change desktop background type to map or load another tiles if current desktop background is map,
	 * used when click on map bg icon
	 * @param  {?object} scope Knockout scope, not used
	 * @param  {object} event Event that triggered this handler
	 */
	app.desktops.changeBackgroundToMap = function changeBackgroundToMap(scope, event) {
		var
			currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

		if (currentDesktop.background.type() === 'map') {
			return true;
		}
		else {
			event.stopImmediatePropagation();
			app.desktops.changeBackground('map', currentDesktop.backgroundInactive.map.value.tileType);
		}
	};

	/**
	 * Delete desktop and all asociated data
	 * @param  {int} desktopId Desktop ID to be deleted
	 */
	app.desktops.deleteDesktop = function deleteDesktop(desktopId) {
		var
			i,
			prev = 1,
			switchToDesktopId = 0,
			desktopIds = app._( app.desktops.listById ).keys().map(function(num){ return parseInt(num, 10); }),
			desktopImgURL;

		if (length_ <= 1) {
			// alert( app.lang.warnings.cant_delete_the_only_one_desktop );

			return false;
		}

		// Delete cached background image if used and not used at another desktops
		desktopImgURL = ( app.desktops.listById[ desktopId ].background.type() === 'image' && app.desktops.listById[ desktopId ].background.value() ) || app.desktops.listById[ desktopId ].backgroundInactive.image.value;
		if ( desktopImgURL && backgroundURLCachedImages_[ desktopImgURL ].desktopsCount ) {
			--backgroundURLCachedImages_[ desktopImgURL ].desktopsCount;
			if ( !backgroundURLCachedImages_[ desktopImgURL ].desktopsCount ) {
				$c_.page_bg_cached_imgs.find('img[src="' + desktopImgURL + '"]').remove();
			}
		}

		// Current desktop delete
		if (app.desktops.currentId() === desktopId) {
			// the 1-st element - switch to the 2-nd desktop
			if (desktopId === desktopIds[0]) {
				switchToDesktopId = desktopIds[1];
			}
			// not first - switch to the previous desktop
			else {
				for (i in desktopIds) {
					if (desktopId === desktopIds[i]) {
						switchToDesktopId = prev;
						break;
					}
					prev = desktopIds[i];
				}
			}

			app.desktops.changeDesktopTo( switchToDesktopId );
		}

		// Delete desktop
		delete app.desktops.listById[ desktopId ];
		app.desktops.list.remove(function(desktop) {
			return desktop.id === desktopId;
		});

		--length_;

		// Update desktop print names
		// for (i in app.desktops.list() ) {
		// 	app.desktops.list()[i].printName(j);
		// 	++j;
		// }

		app.desktops.fixDesktopsListWidth();

		app.core.appStateSave();
	};

	/**
	 * Change desktop to another
	 * @param  {int} desktopId Desktop ID to switch to
	 * @param  {int} forceChange  Force switch also when currentDesktopId == desktopId, using after unserialize the app state
	 * @return {[type]}           [description]
	 */
	app.desktops.changeDesktopTo = function changeDesktopTo(desktopId, forceChange) {
		var
			oldDesktopId = app.desktops.currentId(),
			oldDesktop = app.desktops.listById[ oldDesktopId ],
			oldBG = oldDesktop.background,

			newDesktop = app.desktops.listById[ desktopId ],
			newBG = app.desktops.listById[ desktopId ].background;

		if (oldDesktopId === desktopId && !forceChange) {
			return false;
		}

		// Save old desktop state
		app.units.updateGridsterPositionModel();
		oldDesktop.remoteURLCollection.saveAllWidgetStates();
		desktopBackgroundTypes_[ oldBG.type() ].destroy();

		app.desktops.currentId(desktopId);

		desktopBackgroundTypes_[ newBG.type() ].init( newBG.value() );

		// Restore new desktop state
		app.units.watchSensors = newDesktop.watchSensors;
		app.units.watchCounters = newDesktop.watchCounters;

		app.units.recalcAllUnitsImmediate();
		app.units.createAllWidgets();

		newDesktop.remoteURLCollection.restoreAllWidgets();

		currentDesktopToViewboxCenter_();

		app.core.appStateSave();

		app.reports.minimizeReport();
	};

	/**
	 * Rename desktop
	 * @param  {?int} desktopId Id of desktop to rename, default: current desktop Id
	 */
	app.desktops.renameDesktop = function renameDesktop(desktopId) {
		!desktopId && (desktopId = app.desktops.currentId());

		app.desktops.editId(desktopId);
	};

	/**
	 * Handle desktop icon click, change desktop or delete desktop (if Ctrl key is pressed)
	 * @param  {object} desktop desktop object
	 * @param  {event} event   event that triggered this handle
	 */
	app.desktops.desktopIconClick = function desktopIconClick(desktop, event) {
		var
			desktopId = desktop.id;

		if (event.ctrlKey) {
			app.desktops.deleteDesktop( desktopId );
		}
		else {
			if (desktopId === app.desktops.currentId()) {
				app._.defer(app.desktops.renameDesktop);
			}
			else {
				app.desktops.changeDesktopTo( desktopId );
			}
		}
		app.reports.minimizeReport();

		return true;
	};

	/**
	 * Get length of all desktops
	 * @return {int} desktops length
	 */
	app.desktops.length = function() {
		return length_;
	};

	/**
	 * Get last inserted id of the desktops
	 * @return {int} last inserted desktop id
	 */
	app.desktops.lastId = function() {
		return lastId_;
	};

	/**
	 *
	 * Remote URL methods
	 *
	 */

	/**
	 * Show add remote url popup window
	 */
	app.desktops.remoteURLShow = function remoteURLShow() {
		$c_.remote_url_modal.modal();
	};

	/**
	 * Edit widget remote URL, actually removes previous content and insert new
	 */
	app.desktops.remoteURLShowEdit = function remoteURLShowEdit(widgetID) {
		var
			currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

		app.desktops.remoteURLEditId(widgetID);
		app.desktops.remoteURLInputData( currentDesktop.remoteURLCollection.listById[widgetID].url );

		$c_.remote_url_modal.modal();
	};

	/**
	 * Add/Save remote url as a widget to current desktop
	 */
	app.desktops.remoteURLAddSave = function remoteURLAddSave() {
		var
			newURL = app.desktops.remoteURLInputData(),
			editId = app.desktops.remoteURLEditId(),
			currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

		if (newURL) {
			if (editId) {
				currentDesktop.remoteURLCollection.editRemoteURL(editId, newURL);
			}
			else {
				currentDesktop.remoteURLCollection.addRemoteURL(newURL);
			}
		}

		$c_.remote_url_modal.modal('hide');

		app.core.appStateSave();
	};

	/**
	 * Cancel change/set remote URL
	 */
	app.desktops.remoteURLDontSave = function remoteURLDontSave() {
		$c_.remote_url_modal.modal('hide');
	};

	/**
	 * Whether the remote URL input changed
	 * @return {boolean} true - settings changed, false - otherwise
	 */
	app.desktops.isRemoteURLChanged = function isRemoteURLChanged() {
		var
			newURL = app.desktops.remoteURLInputData(),
			editId = app.desktops.remoteURLEditId(),
			currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

		if (
					(editId && currentDesktop.remoteURLCollection.listById[editId].url !== app.utils.stripHTTP(newURL)) ||
					(!editId && app.$.trim(newURL))
				) {
			return true;
		}

		return false;
	};

	/**
	 *
	 * Background URL window
	 *
	 */

	/**
	 * Show background URL select window
	 */
	app.desktops.backgroundURLShow = function backgroundURLShow() {
		var
			currentDesktop = app.desktops.listById[ app.desktops.currentId() ];

		if ( currentDesktop.background.type() === 'image' ) {
			app.desktops.backgroundURLInputData( app.utils.stripHTTP( currentDesktop.background.value() ) );
		}
		$c_.background_url_modal
			.modal()
			.find('input.clearable').trigger('input');
	};

	/**
	 * Handle set background URL button click
	 */
	app.desktops.backgroundURLSet = function backgroundURLSet() {
		var	url = app.utils.prependHTTP( app.$.trim( app.desktops.backgroundURLInputData() ) );

		if ( app.utils.stripHTTP(url) ) {
			backgroundURLBtnSet_.start();
			backgroundURLImgLoader_.attr('src', url);
		}
		else {
			app.desktops.listById[ app.desktops.currentId() ].background.value(undefined);
			app.desktops.changeBackground('color');
			// desktopBackgroundTypes_.image.destroy();
			$c_.background_url_modal.modal('hide');
			// app.core.appStateSave();
		}
	};

	/**
	 * Cancel set background URL
	 */
	app.desktops.backgroundURLDontSave = function backgroundURLDontSave() {
		$c_.background_url_modal.modal('hide');
	};

	/**
	 * Whether the background URL changed
	 * @return {boolean} true - settings changed, false - otherwise
	 */
	app.desktops.isBackgroundURLChanged = function isBackgroundURLChanged() {
		if (
				(app.desktops.listById[ app.desktops.currentId() ].background.type() === 'image' &&
					app.utils.stripHTTP(app.desktops.backgroundURLInputData()) !== app.utils.stripHTTP(app.desktops.listById[ app.desktops.currentId() ].background.value()) ) ||
				(app.desktops.listById[ app.desktops.currentId() ].background.type() !== 'image' &&
					app.$.trim(app.desktops.backgroundURLInputData()).length )
			) {
			return true;
		}

		return false;
	};

	return app;
})(sensolator || {});

// Sensolator utils module
var sensolator = (function(app){
	'use strict';

	app.notify = app.notify || {};

	/**
	 * Notification
	 * @return {object}
	 */

	app.notify = (function(){
		var $notifyBox = null;
		var _init = function(){
			$notifyBox = $('<div class="mynotify"></div>');
			$('body').append($notifyBox);

			// for test
			// o.add('test');
			// o.add('Success noti', null, 'success');
			// o.add('Error noti', null, 'error');
		};

		var o = {
			add: function(text, initAnimate, type){
				var $noti = $('<div class="noti">'+text+'</div>');
				if(type){
					this.addStyle($noti, type);
				}
				$notifyBox.append($noti);
				$noti.initAnimate = this.initAnimate;

				if(initAnimate){
					setTimeout(function(){
						$noti.initAnimate(initAnimate);
					}, 2000);
				}

				return $noti;
			},
			addStyle: function($el, type){
				if(arguments.length === 1)
					$el = this;
				switch(type){
					case "success":
						$el.addClass('success');
						break;
					case "error":
						$el.addClass('error');
						break;
				}

				return this;
			},
			initAnimate: function(duration){
				if(duration && (_.isNumber(duration)) && duration > 0)
					this.css('transition', Math.floor(duration/1000)+'s');

				this.addClass('h');
				this.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
					this.remove();
				});
			}
		};
		_init();
		return o;
	}());

	return app;
})(sensolator || {});

// Sensolator reports module
var sensolator = (function(app) {
	'use strict';

	app.reports = app.reports || {};

	app.reports.template_list = []; //ko.observableArray([]);
	app.reports.template_type = {};
	app.reports.rows_count = 50;
	app.reports.units_groups_list = [];
	app.reports.units_list = [];
	app.reports.prev_template_type = '';
	app.reports.fdow = 1;

	//***************************
	//Public Properties & Methods
	//***************************

	/**
	 * Extend object containing knockout.js fields, recursive
	 * @param {object} target An object that will receive the new properties or receive updated values
	 * @return {object} target object
	 */
	app.reports.loadReportTemplates = function loadReportTemplates() {
		app.wialon.core.Session.getInstance().loadLibrary("resourceReports");
		var items = app.wialon.util.Helper.sortItems(app.wialon.core.Session.getInstance().getItems("avl_resource"));
		var spec = [];
		var flags = app.wialon.util.Number.or(app.wialon.item.Item.dataFlag.base, app.wialon.item.Item.dataFlag.billingProps, app.wialon.item.Resource.dataFlag.reports);
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			spec.push({
				type: "id",
				data: item.getId(),
				flags: flags,
				mode: 1
			});
		}
		if (spec.length > 0) {
			app.wialon.core.Session.getInstance().updateDataFlags(spec, qx.lang.Function.bind(function(spec, code) {
				if (code)
					return;
                // Store resources list
                app.reports.resources = spec;

				for (var i = 0; i < spec.length; i++) {
					var resourceId = spec[i].data;
					var resource = app.wialon.core.Session.getInstance().getItem(resourceId);

					if (app.wialon.util.Number.and(resource.getUserAccess(), app.wialon.item.Resource.accessFlag.viewReports)) {
						var reports = resource.getReports() ? resource.getReports() : {};

						for (var z in reports) {
							if (reports[z] && ((reports[z].ct === 'avl_unit' && app.reports.units_list.length) || (reports[z].ct === 'avl_unit_group' && app.reports.units_groups_list.length))) {
								reports[z].resource_id = resourceId;
								app.reports.template_list.push(reports[z]);
								app.reports.template_type[reports[z].resource_id + '_' + reports[z].id] = reports[z].ct;
							}
						}
						wialon.util.Helper.sortItems(app.reports.template_list, function(a) {return a.n;});
						// ko.applyBindings(sensolator);
					}
				}

				jQuery("#search_reports").show();
				if(wialon.core.Session.getInstance().checkFeature("reporttemplates") && app.reports.template_list.length && (app.reports.units_groups_list.length || app.reports.units_list.length)){
					var html = '',
						val;

					for (var item in app.reports.template_list) {
						val = app.reports.template_list[item].resource_id+'_'+app.reports.template_list[item].id;
						if(html === ''){
							app.reports.changeReportTemplate(val);
						}
						html += '<option value="' + val + '">' + _.unescape( app.reports.template_list[item].n ) + '</option>';
					}
					jQuery("#report_template").html(html);
					jQuery("#reports_form").show();
					jQuery('#search_reports').removeClass('collapsed');
				}
			}, this, spec));
		}

	};
	// app.reports.fillTemplateSelect = function fillTemplateSelect(){
	// 	var html = '';
	// 	for( template in this.template_list){
	// 		html += "<option value="text: _.unescape( template.n ), value: template.resource_id+'_'+template.id"></option>"
	// 	}
	// 	//<option data-bind="text: _.unescape( template.n ), value: template.resource_id+'_'+template.id"></option>
	// };

	/**
	 * Init desktops DOM elements, called in core.startApp
	 */
	//app.desktops.initDOM = function initDOM() {};
	//
	//
	app.reports.getTimezoneDiff = function getTimezoneDiff( userZone ) {
		var	tt = new Date(),
			jan1 = new Date( tt.getFullYear(), 0, 1, 0, 0, 0, 0 ),
			june1 = new Date( tt.getFullYear(), 6, 1, 0, 0, 0, 0 ),
			temp = jan1.toGMTString(),
			jan2 = new Date( temp.substring( 0, temp.lastIndexOf( ' ' ) - 1 ) );
		temp = june1.toGMTString();
		var june2 = new Date( temp.substring( 0, temp.lastIndexOf( ' ' ) - 1 ) ),
			stdTimeOffset = ( ( jan1 - jan2 ) / 3.6e6 ),
			daylightTimeOffset = ( ( june1 - june2 ) / 3.6e6 );
		if ( stdTimeOffset !== daylightTimeOffset ) {
			// positive is southern, negative is northern hemisphere
			var hemisphere = stdTimeOffset - daylightTimeOffset;
			if ( hemisphere >= 0 ) {
				stdTimeOffset = daylightTimeOffset;
			}
		}
		var userTimezone = wialon.util.DateTime.getTimezoneOffset();
		// unused this case but don't delete
		if ( userZone ) {
			return userTimezone;
		// return wialon.util.DateTime.getTimezoneOffset();// + Math.floor( daylightTimeOffset * 3.6e3 );
		}
		// return locat gmt
		return Math.floor( daylightTimeOffset * 3.6e3 ) * -1;
	};
	app.reports.getBeginningOfDay = function getBeginningOfDay(time) {
		var date = new Date();
		if (time) {
			date.setTime(time * 1000);
		} else {
			date.setTime(wialon.core.Session.getInstance().getServerTime() * 1000);
		}
		var abs_time = date.getTime() / 1000;
		var t = wialon.util.DateTime.userTime(abs_time);
		date.setTime(t * 1000);
		date.setUTCHours(0);
		date.setUTCMinutes(0);
		date.setUTCSeconds(0);
		date.setUTCMilliseconds(0);
		return date.getTime() / 1000;
	};

	app.reports.getEndOfDay = function getEndOfDay(time) {
		var date = new Date();
		if (time) {
			date.setTime(time * 1000);
		} else {
			date.setTime(wialon.core.Session.getInstance().getServerTime() * 1000);
		}
		var abs_time = date.getTime() / 1000;
		var t = wialon.util.DateTime.userTime(abs_time);
		date.setTime(t * 1000);
		date.setUTCHours(23);
		date.setUTCMinutes(59);
		date.setUTCSeconds(59);
		date.setUTCMilliseconds(999);
		return date.getTime() / 1000;
	};

	app.reports.formToggle = function formToggle() {
		if(wialon.core.Session.getInstance().checkFeature("reporttemplates") && app.reports.template_list.length && (app.reports.units_groups_list.length || app.reports.units_list.length)){
			jQuery('#reports_form').toggle();
			jQuery('#search_reports').toggleClass('collapsed');
		}
	};
	/**
	 * Init handler on wialon loaded event
	 * here it loads report tempaltes
	 */
	app.reports.initOnWialonLoaded = function initOnWialonLoaded() {
		var mod = ReportResultTable;
		var tz = -(new Date()).getTimezoneOffset() * 60;
		var user = wialon.core.Session.getInstance().getCurrUser();
		tz = (!user)?tz:parseInt(user.getCustomProperty("tz", tz));
		user.getLocale( function(code, locale) {
			if (!code && locale && locale.wd)
				app.reports.fdow = locale.wd;
		});
		var locale = {};
		locale.formatDate = "%E %B %Y %H:%M";
		var mu = wialon.core.Session.getInstance().getCurrUser().getMeasureUnits();
		switch(mu) {
			case 0:
				locale.flags = 0;
				break;
			case 1:
				locale.flags = wialon.render.Renderer.OptionalFlag.usMetrics;
				break;
			case 2:
				locale.flags = wialon.render.Renderer.OptionalFlag.imMetrics;
				break;
			case 3:
				locale.flags = 0;
				break;
			default:
				locale.flags = 0;
		}
		locale.flags |= wialon.render.Renderer.OptionalFlag.skipBlankTiles || 0;
		wialon.core.Session.getInstance().getRenderer().setLocale(tz, app.langCode, locale, null);
		mod.on_init();

		app.reports.units_groups_list = wialon.util.Helper.filterItems(app.wialon.core.Session.getInstance().getItems('avl_unit_group'), wialon.item.Item.accessFlag.execReports);
		app.reports.units_list = wialon.util.Helper.filterItems(app.wialon.core.Session.getInstance().getItems('avl_unit'), wialon.item.Item.accessFlag.execReports);
		wialon.util.Helper.sortItems(app.reports.units_groups_list, function(a) {return a.getName();});
		wialon.util.Helper.sortItems(app.reports.units_list, function(a) {return a.getName();});

		app.reports.loadReportTemplates();
		jQuery("#interval_to").date_input({
			lang: app.langCode,
			format: '%E %B %Y %H:%M',
			showTime: 24
		}).setDateTimeLoc(app.reports.getEndOfDay());
		jQuery("#interval_from").date_input({
			lang: app.langCode,
			format: '%E %B %Y %H:%M',
			showTime: 24
		}).setDateTimeLoc(app.reports.getBeginningOfDay());
	};

	app.reports.executeReport = function executeReport() {
		var mod = ReportResultTable;
		mod.clear_table();
		jQuery("#report_templates_filter_accordion_content").html('');
		this.maximizeReport();
		wialon.core.Remote.getInstance().startBatch("report");
		mod.set_callback_func(function(rres) {
			if (rres) {
				var stats = rres.getStatistics();
				var tables = rres.getTables();
				var attachments = rres.getAttachments();
				var layer_data = rres.getLayerData();
				var bounds = null;

				var map_ok = false;
				if (layer_data) {
					bounds = layer_data.bounds;
				}
				if (bounds && bounds.length === 4 && (bounds[0] && bounds[1] && bounds[2] && bounds[3])) {
					map_ok = true;
				}

				var html = "", i, dd_list = '';
				if (stats && stats.length) {
					html += "<div pos='-1' tp='table'>" + sensolator.lang.stats + "</div>";
					dd_list += "<li pos='-1' tp='table'>" + sensolator.lang.stats + "</li>";
				}
				if (tables && tables.length) {
					for (i = 0; i < tables.length; i++) {
						html += "<div pos='" + i + "' tp='table'>" + tables[i].label + "</div>";
						dd_list += "<li pos='" + i + "' tp='table'>" + tables[i].label + "</li>";
					}
				}
				if (map_ok) {
					html += "<div pos='-2' tp='attach'>" + sensolator.lang.map + "</div>";
					dd_list += "<li pos='-2' tp='attach'>" + sensolator.lang.map + "</li>";
				} else {
					mod.map = null;
				}

				mod.attachment_photos = [];
				//all attachments
				if (attachments && attachments.length) {
					var charts = '';
					for (i = 0; i < attachments.length; i++) {
						//if attachment chart
						if (attachments[i].type === "chart") {
							if (charts.length === 0) {
								html += "<div pos='" + i + "' tp='attach'>" + sensolator.lang.charts + "</div>";
								dd_list += "<li pos='" + i + "' tp='attach'>" + sensolator.lang.charts + "</li>";
							}
							charts += "<div pos='" + i + "' class='mini-chart'>" + attachments[i].name + "</div>";
						}
						//if attachment image
						else if (attachments[i].type === "photo") {
							mod.attachment_photos.push({
								i: i,
								n: attachments[i].name.split(";")
							});
						}
					}
					if (mod.attachment_photos.length) {
						html += "<div pos='" + -1 + "' tp='attach'>" + sensolator.lang.photos + "</div>";
						dd_list += "<li pos='" + i + "' tp='attach'>" + sensolator.lang.photos + "</li>";
					}
					if (charts.length > 0) {
						jQuery("#report_result_chart_list").html(charts);
						jQuery("#report_result_chart_list :first-child").addClass('selected');
						jQuery("#report_result_chart_list div").click(function() {
							var mod = ReportResultTable;
							if (mod.is_busy())
								return;
							jQuery("#report_result_chart_list div.selected").removeClass("selected");
							jQuery(this).addClass("selected");

							var pos = parseInt(jQuery(this).attr("pos"), 10);
							mod.show_attachment(pos);
						});
					}
				}


				if (html.length) {
					var pdf = {
						"attachMap": 1,
						"compress": 0,
						"delimiter": "semicolon",
						"outputFileName": "Online_report",
						"pageOrientation": "landscap",
						"pageSize": "a4",
						"pageWidth": "0",
						"format": 2
					};
					var xls = {
						"attachMap": 1,
						"compress": 0,
						"delimiter": "semicolon",
						"outputFileName": "Online_report",
						"pageOrientation": "landscap",
						"pageSize": "a4",
						"pageWidth": "0",
						"format": 8
					};
					html = "<div class='export'><a href='" + rres.getExportUrl(wialon.report.ReportResult.exportFormat.pdf, pdf) + "'><img src='img/report/export_pdf.png'></a><a href='" + rres.getExportUrl(wialon.report.ReportResult.exportFormat.xlsx, xls) + "'><img src='img/report/export_xls.png'></a></div>" + html;
					jQuery("#report_templates_filter_accordion_content").html(html);
					jQuery("#report-tabs-dropdown-list").html(dd_list);
					jQuery("#report_templates_filter_accordion_content :nth-child(2)").addClass('selected');
					jQuery("#report-tabs-dropdown-list :first-child").addClass('selected');
					jQuery("#report_templates_filter_accordion_content div, #report-tabs-dropdown-list li").click(function() {
						var mod = ReportResultTable;
						if (mod.is_busy())
							return;
						if (jQuery(this).hasClass("export")) {
							return;
						}

						var pos = parseInt(jQuery(this).attr("pos"), 10);
						var type = jQuery(this).attr("tp");

						jQuery("#report_templates_filter_accordion_content .selected").removeClass("selected");
						jQuery("#report-tabs-dropdown-list .selected").removeClass("selected");
						jQuery("#report_templates_filter_accordion_content [pos=" + pos + "][tp=" + type + "], #report-tabs-dropdown-list [pos=" + pos + "][tp=" + type + "]").addClass("selected");

						if (type === "table") {
							mod.show_table(pos);
						} else {
							mod.show_attachment(pos);
						}
					});
				}
				//add style (selection)

				if (stats && stats.length) {
					mod.show_table(-1);
				} else if (tables && tables.length) {
					mod.show_table(0);
				} else if (attachments && attachments.length) {
					mod.show_attachment(0);
				} else if (map_ok) {
					mod.show_attachment(-2);
				}
			}
		});

		var from = jQuery("#interval_from").getDateTimeAbs(),
			to = jQuery("#interval_to").getDateTimeAbs()+59,
			flags = 0x00;
			var interval = {
				from: from,
				to: to,
				flags: flags
			};
		switch (jQuery('#interval').val()) {
			case "today":
				// interval = wialon.util.DateTime.calculateInterval(from, to, 0x01);
				// interval.flags = 16777216;//0x00;
				interval.flags = wialon.util.DateTime.calculateFlags(0, app.reports.fdow);
				break;
			case "yesterday":
				// Synchronize with Hosting logic
				interval.flags = wialon.util.DateTime.calculateFlags(0x2, app.reports.fdow);
				interval.from = 0;
				interval.to = 1;
				break;
			case "week":
				interval.flags = wialon.util.DateTime.calculateFlags(0x4, app.reports.fdow);
				interval.from = 0;
				interval.to = 1;
				break;
			case "month":
				interval.flags = wialon.util.DateTime.calculateFlags(0x8, app.reports.fdow);
				interval.from = 0;
				interval.to = 1;
				break;
			case "custom":
				// interval = wialon.util.DateTime.calculateInterval(from, to, 0x01);
				// interval.flags = 16777216;//0x00;
				interval.flags = wialon.util.DateTime.calculateFlags(0, app.reports.fdow);
				break;
		}

/*
		var mod_usl = WebCMS.get_module("user_settings_locale");
		if (!mod_usl)
			return;
		var obj = new Object();
		obj.flags = parseInt(jQuery("#interval_type_" + id).val());
		obj.from = jQuery("#time_from_" + id).getDateTimeAbs();
		obj.to = jQuery("#time_to_" + id).getDateTimeAbs() + 59;
		if (obj.flags == 0x01) {
			var flags = wialon.util.DateTime.calculateFlags(obj.flags, mod_usl.fdow);
			obj.to = obj.from;
			obj = wialon.util.DateTime.calculateInterval(obj.from,obj.to,obj.flags);
			obj.flags = flags;
		} else if (obj.flags == 0x02) {
			var curr = jQuery("#include_current_time" + id).prop("checked")  ? 32 : 0;
			var flags = parseInt(jQuery("#last_type_" + id).val()) + curr;
			flags = wialon.util.DateTime.calculateFlags(flags,mod_usl.fdow);
			obj.from = 0;
			var mod_nc = WebCMS.get_module("num_counter");
			if (mod_nc)
				obj.to = mod_nc.get_value("prev_val_" + id);
			if (this.report_intervals && typeof this.report_intervals[id] != "undefined" && !this.report_intervals[id].skip_convert)
				obj = wialon.util.DateTime.calculateInterval(obj.from,obj.to,flags);
			obj.flags = flags;
		} else
			obj.flags = wialon.util.DateTime.calculateFlags(obj.flags, mod_usl.fdow);
		return obj;
*/

		// var interval = {
		// 	from: from - sensolator.reports.getTimezoneDiff(1),
		// 	to: to - sensolator.reports.getTimezoneDiff(1)+59,
		// 	flags: flags
		// };
		var rep_sel = jQuery("#report_template").val();
		if(!rep_sel) {
			sensolator.reports.closeReport();
			wialon.core.Remote.getInstance().finishBatch(null, "report");
			return;
		}
		rep_sel = rep_sel.split("_");
		var selection = {
			report_item_id: rep_sel[0],
			report_id: rep_sel[1],
			object_id: jQuery("#report_unit").val(),
			object_prop_id: 0
		};
		mod.generate(selection.report_item_id, selection.report_id, selection.object_id, selection.object_prop_id, interval);
		wialon.core.Remote.getInstance().finishBatch(null, "report");

	};

	app.reports.changeSelectInterval = function changeSelectInterval(event) {
		if (event.target.value === "today" || event.target.value === "custom") {
			jQuery("#interval_to").setDateTimeLoc(app.reports.getEndOfDay());
			jQuery("#interval_from").setDateTimeLoc(app.reports.getBeginningOfDay());
		}
		if (event.target.value !== 'custom') {
			jQuery(".left_panel").removeClass('custom-interval');
			jQuery(".interval_input").hide();
		} else {
			jQuery(".left_panel").addClass('custom-interval');
			jQuery(".interval_input").show();
		}

	};
	app.reports.changeReportTemplate = function changeReportTemplate(id) {
		var list = [];
		if(app.reports.template_type[id] === app.reports.prev_template_type) return;
		app.reports.prev_template_type = app.reports.template_type[id];
		switch (app.reports.template_type[id]) {
			case "avl_unit_group":
				list = app.reports.units_groups_list;
				break;
			case "avl_unit":
				list = app.reports.units_list;
				break;
		}

		var html = '';
		for (var item in list) {
			html += '<option value="' + list[item].getId() + '">' + list[item].getName() + '</option>';
		}
		jQuery("#report_unit").html(html);
	};
	app.reports.minimizeReport = function minimizeReport(event) {
		if(!ReportResultTable.report_result) return;
		jQuery("#report_window").hide();
		jQuery("#minimized_report").show();
	};
	app.reports.maximizeReport = function maximizeReport(event) {
		jQuery("#report_window").show();
		jQuery("#minimized_report").hide();
	};

	app.reports.closeReport = function closeReport(event) {
		ReportResultTable.report_result = null;
		jQuery("#report_window").hide();
		jQuery("#minimized_report").hide();
	};

	return app;
})(sensolator || {});

var ReportResultTable = {
	/// Current report
	report: null,
	/// Current resource plugin
	report_item: null,
	/// Messages on page can be
	msgs_per_page: [25, 50, 100, 200, 500],
	/// Photos on page can be
	photos_per_page: [10, 25, 50],
	photos: null,
	/// Report generation result
	report_result: null,
	/// Wait in progress
	wait_hidden: false,
	lb_interval: null,
	/// Report web object name
	rweb: "",
	/// Images sources
	next_img_src: "./img/report/next.png",
	last_img_src: "./img/report/last.png",
	prev_img_src: "./img/report/prev.png",
	first_img_src: "./img/report/first.png",
	globe_img_src: "./img/report/globe.png", //
	hide_img_url: "./img/report/level_minus.png",
	show_img_url: "./img/report/level_plus.png",
	none_img_url: "./img/report/none.png",
	none16_img_url: "./img/report/none16.png",
	none13_img_url: "./img/report/none_tree.png",
	levels_img_url: ["./img/report/level_1.png", "./img/report/level_2.png", "./img/report/level_3.png", "./img/report/level_4.png"],
	tline_img_url: "./img/report/level_T.png",
	fline_img_url: "./img/report/level_L.png",
	vline_img_url: "./img/report/level_vline.png",
	hline_img_url: "./img/report/level_line.png",
	/// Report object (unit, unit group)
	report_obj: null,
	resizeTimer: null,

	/// Enable go to messages option
	go_to_msgs_enabled: false,

	/**
		Public methods
	*/
	/// Get unit
	get_unit: function() {
		if (!this.report_obj)
			return null;
		if (typeof this.report_obj.getType !== 'undefined' && this.report_obj.getType() === "avl_unit")
			return this.report_obj;
		return null;
	},
	/// Callback function - called after report generation
	set_callback_func: function(func) {
		this.callback_func = func;
	},
	/// Check busy state
	is_busy: function() {
		return this.wait_hidden;
	},
	make_text: function(html) {
		html = "" + html;
		html = html.replace(/onAbort/gi, "_onAbort");
		html = html.replace(/onBlur/gi, "_onBlur");
		html = html.replace(/onChange/gi, "_onChange");
		html = html.replace(/onClick/gi, "_onClick");
		html = html.replace(/onDblClick/gi, "_onDblClick");
		html = html.replace(/onError/gi, "_onError");
		html = html.replace(/onFocus/gi, "_onFocus");
		html = html.replace(/onKeyDown/gi, "_onKeyDown");
		html = html.replace(/onKeyPress/gi, "_onKeyPress");
		html = html.replace(/onKeyUp/gi, "_onKeyUp");
		html = html.replace(/onLoad/gi, "_onLoad");
		html = html.replace(/onMouseDown/gi, "_onMouseDown");
		html = html.replace(/onMouseMove/gi, "_onMouseMove");
		html = html.replace(/onMouseOut/gi, "_onMouseOut");
		html = html.replace(/onMouseOver/gi, "_onMouseOver");
		html = html.replace(/onMouseUp/gi, "_onMouseUp");
		html = html.replace(/onMove/gi, "_onMove");
		html = html.replace(/onReset/gi, "_onReset");
		html = html.replace(/onResize/gi, "_onResize");
		html = html.replace(/onSelect/gi, "_onSelect");
		html = html.replace(/onSubmit/gi, "_onSubmit");
		html = html.replace(/onUnload/gi, "_onUnload");
		html = html.replace(/javascript/gi, "_javascript");
		return html.replace(/<script>/gi, "&lt;script&gt;").replace(/<\/script>/gi, "&lt;\/script&gt;");
	},
	/// Initially generate report and display its records
	generate: function(res_id, report_id, object_id, object_prop_id, interval) {
		if (!res_id || !report_id)
			return false;
		this.report_obj = null;
		this.report_obj = wialon.core.Session.getInstance().getItem(object_id);
		var resource = wialon.core.Session.getInstance().getItem(res_id);
		if (!resource)
			return false;
		//get report
		var report = resource.getReport(report_id);
		if (!report)
			return false;
		this.wait(true);
		this.report_item = resource;
		resource.execReport(report, object_id, object_prop_id, interval, qx.lang.Function.bind(this.on_generate_done, this));
		return true;
	},
	/// Report generation finished
	on_generate_done: function(code, result) {
		var mod = ReportResultTable;
		this.wait(false);
		if (code) {
			if (code === 1003) {
				this.show_error(sensolator.lang["1003"]);
			} else if (code === 1004) {
				this.show_error(sensolator.lang["1004"]);
			} else if (code === 1005) {
				this.show_error(sensolator.lang["1005"]);
			}
			this.show_error(sensolator.lang["err_perf_req"]);
			mod.report_result = null;
			return;
		}
		var tables = result.getTables();
		var stats = result.getStatistics();
		var attachments = result.getAttachments();
		var layer = result.getLayerData();
		if (!tables.length && !stats.length && !attachments.length && (typeof layer === "undefined" ||
			(layer.bounds[0] === 0 && layer.bounds[1] === 0 && layer.bounds[2] === 0 && layer.bounds[3] === 0 &&
			(typeof layer.units === "undefined" || layer.units.length === 0)))) {
			this.show_error(sensolator.lang.exec_error);
			return;
		}


		//prepare result arrays
		mod.tables = [];
		//fill tables array
		for (var i = 0; tables && i < tables.length; i++) {
			var table = {};
			table.header = tables[i].header;
			table.rows_count = tables[i].rows;
			table.rows = [];
			table.content = {};
			table.rows_detail = {};
			table.msgs = [];
			table.level = tables[i].level;
			table.detailed = table.level > 1 ? true : false;
			table.total = tables[i].total;
			table.flags = tables[i].flags;
			table.msg_from = 0;
			table.msgs_per_page = mod.msgs_per_page[1];
			mod.tables.push(table);
		}

		if (stats && stats.length) {
			mod.stats_table = {};
			mod.stats_table.flags = 0;
			mod.stats_table.rows = stats;
			mod.stats_table.rows_count = stats.length;
			mod.stats_table.msg_from = 0;
			mod.stats_table.msgs_per_page = mod.msgs_per_page[1];
		}
		mod.charts = {};
		mod.report_result = result;
		jQuery("#report_result_photos_per_page").val(mod.photos_per_page[0]);
		//peform callback
		if (typeof mod.callback_func === "function") {
			mod.callback_func(result);
		}
	},
	/// Error calback
	show_error: function(msg) {
		if (msg) {
			sensolator.reports.closeReport();
			alert(msg);
		}
		this.wait(false);
	},
	/// Show selected table (-1 show stats table)
	show_table: function(table_index, msg_from, msg_to, level, append) {
		append = append || false;
		if (!append) {
			this.clear_table(false, true, false, true);
			jQuery("#report_result_map").css("display", "none");
		}

		var rres = this.report_result;
		if (!rres) {
			this.show_error(sensolator.lang.report_empty);
			return false;
		}
		this.current_table_index = table_index;
		//table with rows
		var table = null;
		if (table_index === -1) {
			table = this.stats_table;
		} else {
			table = this.tables[table_index];
		}
		if (!table) {
			this.show_error(sensolator.lang.invalid_table);
			return;
		}
		//fill rows with zeros
		if (table.rows.length !== table.rows_count) {
			for (var i = 0; i < table.rows_count; i++) {
				table.rows.push(null);
			}
		}
		if (!msg_from && !msg_to) {
			if (table.msg_from && !append) {
				msg_from = table.msg_from;
				msg_to = table.msgs_per_page === -1 ? table.rows_count : table.msg_from + table.msgs_per_page;
			} else {
				msg_from = 0;
				msg_to = table.msgs_per_page === -1 ? table.rows_count : table.msgs_per_page - 1;
			}
		}
		if (!level) {
			level = 0;
		}
		//message index is out of range
		if (msg_from >= table.rows_count) {
			this.show_error(sensolator.lang.out_of_range);
			return;
		}
		if (msg_from < 0) {
			msg_from = 0;
		}
		if (msg_to >= table.rows_count) {
			msg_to = table.rows_count - 1;
		}
		var download = true;
		for (var pos in table.content) {
			if (parseInt(pos) === msg_from && table.content[pos].to >= msg_to && table.content[pos].level >= level) {
				download = false;
				break;
			}
		}
		//change current table object
		this.current_table = table;
		//load from cache
		if (!download) {
			this.show_rows(msg_from, msg_to, level, append);
			return;
		}
		//download missing rows
		this.wait(true);
		var spec = {
			type: "range",
			data: {
				from: msg_from,
				to: msg_to,
				level: level
			}
		};
		this.report_result.selectRows(this.current_table_index, spec, qx.lang.Function.bind(function(params, code, result) {
			var mod = ReportResultTable;
			mod.wait(false);
			//error
			if (code || !mod.current_table) {
				mod.show_error(sensolator.lang.downloading_error);
				return;
			}
			var tres = result;
			//fill result table
			for (var i = 0; i < tres.length; i++) {
				mod.current_table.rows[params.from + i] = tres[i];
			}
			//perform callback
			mod.show_rows(params.from, params.to, params.level, append);
			if (!mod.current_table.content) {
				mod.current_table.content = {};
			}
			mod.current_table.content[params.from] = {
				to: params.to,
				level: params.level
			};
		}, this, spec.data));
	},
	/// Show photo
	show_photos: function(id) {
		var mod = ReportResultTable;
		var img = document.createElement("img");
		img.src = this.report_result.getPhotoUrl(mod.attachment_photos[id].i, 0);
		jQuery("#report_result_body_target .selected").removeClass("selected");
		jQuery("#photo_" + id).addClass("selected");
		document.getElementById("photo_preview").innerHTML = '';
		document.getElementById("photo_preview").appendChild(img);
	},
	create_images_list: function(from, to) {
		var list = '';
		var photos_to_load = 10;
		var mod = ReportResultTable;
		if (!to) {
			to = from + photos_to_load;
		}
		if (to > mod.attachment_photos.length) {
			to = mod.attachment_photos.length;
		}
		mod.loaded_photos = to;
		for (var i = from; i < to; i++) {
			list += "";
			var url = mod.report_result.getPhotoUrl(mod.attachment_photos[i].i, 150);
			list += "<div id='photo_" + i + "' class='photo' onclick='ReportResultTable.show_photos(" + i + ");'><img src='" + url + "'/>";
			list += "<div class='text'>" + mod.attachment_photos[i].n[0] + "</div>";
			list += "</div>";
		}
		if (from > 0) {
			jQuery("#report_result_body_target").append(list);
		} else {
			jQuery("#report_result_body_target").html(list);
		}

	},
	///Show photo impl
	show_photo_impl: function(id) {
		///Save message image to file
		var h = 0;
		var url = this.report_result.getPhotoUrl(id, h);
		window.open(url, "_blank", "");
	},
	/// Show attachment
	show_attachment: function(attach_id) {
		var h,
				w,
				photos_per_page_cur;
		var mod = ReportResultTable;
		if (attach_id === -2) { // map
			this.clear_table(true, null, true, false);
			h = jQuery("#report_result_target").height() - jQuery("#report_result_toolbars_container").height();
			w = jQuery("#report_result_target").width();
			photos_per_page_cur = this.photos_per_page[0];

			jQuery("#report_result_chart").css("display", "none");
			jQuery("#report_result_photo").css("display", "none");
			jQuery("#report_result_map").css("display", "");
			mod.wait(true);
			var map = jQuery("#report_result_map");
			mod.map = mod.report_result.getMapUrl(map.width(), map.height());
			jQuery("#report_result_map").html('<img src="' + mod.map + '" onload="ReportResultTable.wait();">');

			jQuery("#report_result_body_target").scrollTop(0);
			jQuery("#report_result_photo_toolbar").css("display", "none");
		} else if (attach_id === -1) { //if attach image
			this.clear_table(true, null, true, false);

			jQuery("#report_result_chart").css("display", "none");
			jQuery("#report_result_map").css("display", "none");
			jQuery("#report_result_photo").css("display", "");

			if (typeof (jQuery("#report_result_photos_per_page").val()) !== "undefined") {
				photos_per_page_cur = jQuery("#report_result_photos_per_page").val();
			}

			mod.create_images_list(0);
			mod.show_photos(0);
			jQuery('.report-result-body-target').scroll(function() {
				if (jQuery('.report-result-body-target').scrollTop() + jQuery('.report-result-body-target').height() >= jQuery('#report_result_body_target').height()) {
					ReportResultTable.create_images_list(ReportResultTable.loaded_photos);
				}
			});
			jQuery(".report-result-body-target").scrollTop(0);
			jQuery("#report_result_photo_toolbar").css("display", "");
		} else { // charts
			this.clear_table(true, null, false, true);

			jQuery("#report_result_map").css("display", "none");
			h = jQuery("#report_result_chart_result").outerHeight();
			w = jQuery("#report_result_chart_result").width();

			jQuery("#report_result_chart_result").chart({
				report_result: this.report_result,
				attach_id: attach_id, //report attament index
				on_loadimg: function() {
					ReportResultTable.wait();
					// ReportResultTable.resize();
				},
				height: h,
				translation: sensolator.lang,
				chart_height: h,
				chart_width: w,
				toollbar_container: jQuery("#chart_toolbar_container").html("").get()
			});
		}
	},
	/// Get row html
	get_row_html: function(table, row, id, opened) {
		var pos = id.join(",");
		var html = "<tr pos='" + pos + "'";
		if (id.length > 1) {
			html += " class='report-result-body-subrow" + (id.length - 2) + "'>";
		} else {
			html += ">";
		}
		var cells = row.c ? row.c : row;
		if (table.detailed) {
			html += "<td class='report-result-body-detail'>";
			var rows = table.rows, i;
			for (i = 0; i < id.length - 1; i++) {
				if (i < id.length - 2) {
					if (rows[id[i]].r.length - 1 !== parseInt(id[i + 1], 10)) {
						html += "<img src='" + this.vline_img_url + "' class='vline'/>";
					}
					//!rows.length - 1 == parseInt(id[i]))
					else {
						html += "<img src='" + this.none13_img_url + "'/>";
					}
				//else
				} else {
					if (rows[id[i]].r.length - 1 !== parseInt(id[i + 1], 10)) {
						html += "<img src='" + this.tline_img_url + "' class='tline'/>";
					} else {
						html += "<img src='" + this.fline_img_url + "' class='lline'/>";
					}
				}

				rows = rows[id[i]].r;
			}
			if (row.d) {
				if (opened) {
					html += "<img class='report-result-body-clickable' opened='1' src='" + this.hide_img_url + "'/>";
				} else {
					html += "<img class='report-result-body-clickable' src='" + this.show_img_url + "'/>";
				}
			} else {
				html += "<img src='" + this.hline_img_url + "' class='hline'/>";
			}
			for (i = id.length; i < table.level; i++) {
				html += "<img src='" + this.none_img_url + "'/>";
			}
			html += "</td>";
		}

		for (var j = 0; j < cells.length; j++) {
			var cell = cells[j];
			if (!cell) {
				html += "<td>-----</td>";
				continue;
			}
			html += "<td";
			//simple text without coordinates
			if (typeof cell === "string") {
				cell = this.make_text(cell);
				html += ">" + (cell.length > 200 ? cell.substr(0, 200) + "..." : cell);
			} else {
				var lat = cell.y ? " lat='" + cell.y + "'" : "";
				var lon = cell.x ? " lon='" + cell.x + "'" : "";
				var value = cell.v ? " val='" + cell.v + "'" : "";
				var class_name = this.go_to_msgs_enabled && cell.v ? "go-to-msgs-pointer" : "report-result-table-pointer";
				html += lat + lon + value + " class='" + class_name + "'>" + (cell.t.length > 200 ? cell.t.substr(0, 200) + "..." : cell.t);
			}
			html += "</td>";
		}
		html += "</tr>";
		return html;
	},
	/// Recursively show rows
	show_rows_impl: function(table, from, to, rows, parent, level) {
		var html = "";
		for (var i = from; i < to; i++) {
			var row = rows[i];
			if (!row)
				continue;
			var opened = level > 0 ? true : false;
			row.opened = opened;
			html += this.get_row_html(table, row, parent.concat([i]), opened);
			if (opened && row.r && row.r.length) {
				html += this.show_rows_impl(table, 0, row.r.length, row.r, parent.concat([i]), level - 1);
			}
		}
		return html;
	},
	/// Show rows
	/* global show_error */
	show_rows: function(from, to, level, append) {
		append = append || false;
		var table = this.current_table;
		if (!table || !table.rows || !table.rows.length) {
			show_error(sensolator.lang.report_empty);
			return;
		}
		this.wait(true);
		var div1 = "";
		var div2 = "";
		//clear table
		if (!append) {
			this.clear_table(false, true, false, true);
		}
		table.msg_from = from;
		table.msg_to = to;
		var html = '', i;
		html += this.show_rows_impl(table, from, to + 1, table.rows, [], level, []);
		if (append) {
			jQuery("#report_result_body").append(html);
			this.wait(false);
			return;
		} else {
			jQuery("#report_result_body").html(html);
		}
		//dump header
		if (table.header) {
			html = '';
			if (table.detailed) {
				html += "<div skip='1'>";
				for (i = 0; i < table.level; i++) {
					html += "<img pos='" + i + "'  class='report-result-header-detail' src='" + (this.levels_img_url[i % 4]) + "'/>";
				}
				html += "</div>";
			}

			for (i = 0; i < table.header.length; i++) {
				html += "<div>" + div1 + table.header[i] + div2 + "</div>";
			}
			jQuery("#report_result_header").html(html).show();
			jQuery("#report_result_target").removeClass("no-header");
		}
		//dump total
		if (table.total) {
			html = "";
			if (table.detailed) {
				html += "<div skip='1'>";
				for (i = 0; i < table.level; i++) {
					html += "<img class='report-result-header-detail' src='" + this.none13_img_url + "'/>";
				}
				html += "</div>";
			}
			for (i = 0; i < table.total.length; i++) {
				html += "<div>" + div1 + (table.total[i].length ? (table.total[i].length > 200 ? table.total[i].substr(0, 200) + "..." : table.total[i]) : "-----") + div2 + "</div>";
			}
			jQuery("#report_result_footer").html(html).show();
			jQuery("#report_result_target").removeClass("no-footer");
		}
		//bind trips events
		this.create_table_header(table);
		this.wait(false);
	},
	/// Bind events to cells
	bind_cell_events: function(tr) {
		jQuery(tr).click(function(event) {
			var mod = ReportResultTable,
					pos;
			if (jQuery(event.target).hasClass("report-result-header-detail")) {
				pos = parseInt(jQuery(event.target).attr("pos"), 10);
				mod.show_table(mod.current_table_index, mod.msg_from, mod.msg_to, pos);
			} else if (jQuery(event.target).hasClass("report-result-body-clickable")) {
				if (jQuery(event.target).attr("skip"))
					return;
				pos = jQuery(event.target).parent().parent().attr("pos");
				var id = pos.split(",");
				mod.show_sub_rows(id, jQuery(event.target).attr("opened") ? true : false);
			}
			return false;
		});
	},
	/// Show rows
	show_sub_rows: function(pos, hide) {
		var row_index = pos.join(",");
		var row = this.current_table.rows[pos[0]], i;
		for (i = 1; i < pos.length; i++) {
			row = row.r[pos[i]];
		}
		if (!row)
			return;
		var td = jQuery("#report_result_body tr[pos='" + row_index + "'] .report-result-body-detail");
		if (hide) {
			this.wait(true);
			row.opened = false;
			jQuery("#report_result_body tr[pos^='" + row_index + ",']").remove();
			jQuery(".report-result-body-clickable", td).attr("src", this.show_img_url).removeAttr("opened");
			this.create_table_header(this.current_table);
			this.wait(false);
			return;
		}
		var subrows = row.r;
		if (subrows && subrows.length) {
			this.wait(true);
			row.opened = true;
			var prev_tr = jQuery("#report_result_body tr[pos='" + row_index + "']");
			for (i = 0; i < subrows.length; i++) {
				var new_pos = pos.concat([i]);
				var html = this.get_row_html(this.current_table, subrows[i], new_pos);
				prev_tr.after(html);
				prev_tr = jQuery("#report_result_body tr[pos='" + (new_pos.join(",")) + "']");
				this.bind_cell_events(prev_tr);
			}
			jQuery(".report-result-body-clickable", td).attr("src", this.hide_img_url).attr("opened", 1);
			this.create_table_header(this.current_table);
			this.wait(false);
			return;
		}
		this.wait(true);
		//make server request
		var spec = {
			type: "row",
			data: {
				rows: pos,
				level: 0
			}
		};
		this.report_result.selectRows(this.current_table_index, spec, qx.lang.Function.bind(function(row, pos, code, result) {
			var mod = ReportResultTable;
			mod.wait(false);
			//error
			if (code) {
				mod.show_error(sensolator.lang.downloading_error);
				return;
			}
			row.r = result;
			//perform callback
			mod.show_sub_rows(pos, hide);
		}, this, row, pos));
	},
	create_table_header: function(table) {
		//create noscrolled header
		var widths = [];
		jQuery("#report_result_body tr:eq(0) td").each(function() {
			widths.push(jQuery(this).width());
		});
		var pos = 0;
		jQuery("#report_result_header div").each(function() {
			if (jQuery(this).width() > widths[pos]) {
				widths[pos] = jQuery(this).width();
			}
			pos++;
		});
		pos = 0;
		jQuery("#report_result_footer div").each(function() {
			if (jQuery(this).width() > widths[pos]) {
				widths[pos] = jQuery(this).width();
			}
			pos++;
		});

		pos = 0;
		jQuery("#report_result_body tr:eq(0) td").each(function() {
			jQuery(this).css("width", widths[pos]);
			jQuery(this).css("max-width", widths[pos]);
			jQuery(this).css("min-width", widths[pos]);
			pos++;
		});
		pos = 0;
		jQuery("#report_result_header div").each(function() {
			jQuery(this).css("width", widths[pos]);
			jQuery(this).css("max-width", widths[pos]);
			jQuery(this).css("min-width", widths[pos]);
			pos++;
		});
		pos = 0;
		jQuery("#report_result_footer div").each(function() {
			jQuery(this).css("width", widths[pos]);
			jQuery(this).css("max-width", widths[pos]);
			jQuery(this).css("min-width", widths[pos]);
			pos++;
		});
		var curr_page = 0;
		var total_pages = 1;
		var msg_from = 0;
		var msg_to = table.rows_count;
		if (table.msgs_per_page !== -1) {
			curr_page = parseInt(table.msg_from / table.msgs_per_page, 10);
			total_pages = table.rows_count % table.msgs_per_page ? parseInt(table.rows_count / table.msgs_per_page, 10) + 1 : parseInt(table.rows_count / table.msgs_per_page, 10);
			msg_from = table.msg_from;
			msg_to = msg_from + table.msgs_per_page;
			if (msg_to > table.rows_count) {
				msg_to = table.rows_count;
			}
		}
		jQuery("#report_result_toolbar_page").val(curr_page + 1);
		jQuery("#report_result_toolbar_pages").html(sensolator.lang.pages_descr.replace(/\{total\}/g, total_pages));
		var input_toolbar_page_width = 7 * String(total_pages).length + 12; //formula for calculation input width by riel
		jQuery("#report_result_toolbar_page").width(input_toolbar_page_width).css('text-align', 'center');
		jQuery("#report_result_toolbar_messages").html(sensolator.lang.msgs_descr.replace(/\{from\}/g, (msg_from + 1)).replace(/\{to\}/g, msg_to).replace(/\{total\}/g, table.rows_count));
		jQuery("#report_result_msgs_per_page").val(table.msgs_per_page);
		//resize table
		this.resize();
	},
	/// Hide row trip
	/// Set count of messages for display on one page
	change_msg_per_page: function(count) {
		if (!this.current_table)
			return;
		this.current_table.msgs_per_page = count;
		if (count === -1) {
			count = this.current_table.rows_count - 1;
		} else {
			count--;
		}
		this.show_table(this.current_table_index, 0, count);
	},
	/// Wait (busy)
	wait: function(hide) {
		var mod = ReportResultTable;
		if (mod.wait_hidden === hide)
			return;
		if (hide) {
			jQuery("#reports_form button").prop('disabled', true);
			jQuery("#report_result_target").prepend("<div id='report_result_table_wait_div'><div class='load-bar lbleft'></div><div class='vertical-padding'></div><div class='loading_report'><img src='img/report/loader.gif'/><br>" + sensolator.lang.procmsg + "</div></div>");
			mod.lb_interval = setInterval(function() {
				var lb = jQuery("#report_result_table_wait_div .load-bar");
				if (lb.hasClass('lbleft')) {
					lb.addClass('lbfull');
					lb.removeClass('lbleft');
				} else if (lb.hasClass('lbfull')) {
					lb.addClass('lbright');
					lb.removeClass('lbfull');
				} else if (lb.hasClass('lbright')) {
					lb.addClass('lbleft');
					lb.removeClass('lbright');
				}
			}, 1000);
		} else {
			clearInterval(mod.lb_interval);
			jQuery("#report_result_table_wait_div").remove();
			jQuery("#reports_form button").prop('disabled', false);
		}
		mod.wait_hidden = hide;
	},
	/**
		Private methods
	*/
	/// Application initialized event handler
	on_init: function() {
		jQuery("#report_result_target").addClass("report-result-target");
		//Create html contanier for header toolbars
		var html = "";

		html += "<div id='report_result_toolbars_container'>";
		html += "<div id='report_result_toolbar'></div>";
		html += "<div id='report_result_chart_toolbar'><div id=chart_toolbar_container></div></div>";
		html += "<div id='report_result_photo_toolbar'><div id=photo_toolbar_container></div></div>";
		html += "</div>";
		//Create report result contanier
		html += "<div class='report-result-target-table'>";
		html += "<div id='report_result_header'></div>";
		html += "<div id='report_result_footer'></div>";
		html += "<div class='vertical-scroll'><table class='table table-striped' id='report_result_body'></table></div>";
		html += "<div id='report_result_chart' style='display: none'><div id='report_result_chart_list'></div><div id='report_result_chart_result'></div></div>";
		html += "<div id='report_result_photo' style='display: none'><div class='report-result-body-target'><div id='report_result_body_target'></div></div><div id='photo_preview'></div></div>";
		html += "<div id='report_result_map' style='display: none'></div>";
		html += "</div>";



		jQuery("#report_result_target").html(html);

		this.bind_cell_events("#report_result_body");
		this.bind_cell_events("#report_result_header");
		this.create_navigation_toolbar();

		jQuery(window).resize(function(evt) {
			evt.stopPropagation();
			ReportResultTable.resize();
		});

		//Bind events and config print, export and clear buttons
		this.clear_all();
	},
	/// Do resize proc
	resize: function() {

		// var h = ;
		var w = jQuery("#report_result_chart_result").width();

		//if chart else image
		if (jQuery("#report_result_chart").css("display") !== "none") {
			clearTimeout(this.resizeTimer);
			// h-=10;
			this.resizeTimer = setTimeout(function() {
				jQuery("#report_result_chart_result").chartResize({ /*height: h, width: w, calc_height: 1,*/
					chart_height: jQuery("#report_result_chart_result").outerHeight(),
					chart_width: jQuery("#report_result_chart_result").width()
				});
			}, 200);
			return;
		} else if (jQuery("#report_result_photo").css("display") !== "none") {
			var h = h - jQuery("#report_result_toolbars_container").height();
			if (w < jQuery(".report-result-target-table").width()) {
				h -= 16;
			} //fix scroll
			jQuery("#report_result_body_target").height(h);
			return;
		}
		//scrolling correction
		var w_table = jQuery(".report-result-body-table").width();
		if (w < w_table) {
			var h_body = jQuery("#report_result_body_target").height();
			jQuery("#report_result_body_target").height(h_body - 15);
		}

	},
	/// Clear all tables
	clear_all: function() {
		this.clear_table();
		this.current_table = null;
		this.current_table_index = null;
		this.report_result = null;
		this.report_obj = null;
		if (this.report_item) {
			this.report_item.cleanupResult();
		}
		this.tables = null;
		this.stats_table = null;
		jQuery("#report_result_toolbars_container").css("display", "none");
	},
	/// Create table navigation toolbar
	create_navigation_toolbar: function() {
		var html = "<div class='report-result-toolbar-target' id='report_result_toolbar_table'>";
		html += "<div class='toolbar-controls-left'>";
		html += "<img id='report_result_toolbar_first' type='0' src='" + this.first_img_src + "'/>";
		html += "<img id='report_result_toolbar_prev' type='1' src='" + this.prev_img_src + "'/>";

		html += "<span id='report_result_toolbar_messages'></span>";

		html += "<select id='report_result_msgs_per_page' title='" + sensolator.lang.msgs_per_page + "'>";
		for (var i = 0; i < this.msgs_per_page.length; i++) {
			html += "<option value='" + this.msgs_per_page[i] + "'>" + (this.msgs_per_page[i] === -1 ? sensolator.lang.msgs_all : this.msgs_per_page[i]) + "</option>";
		}
		html += "</select>";

		html += "<input type='text' id='report_result_toolbar_page'/>&nbsp;";
		html += "<span id='report_result_toolbar_pages'></span></div>";

		html += "<div class='toolbar-controls-right'><img id='report_result_toolbar_next' type='2' src='" + this.next_img_src + "'/>";
		html += "<img id='report_result_toolbar_last' type='3' src='" + this.last_img_src + "'/>";
		html += "</div></div>";
		jQuery("#report_result_toolbar").html(html);
		//bing events
		jQuery("#report_result_msgs_per_page").change(function() {
			ReportResultTable.change_msg_per_page(parseInt(jQuery(this).val(), 10));
		});
		// jQuery('.vertical-scroll').scroll(function() {
		// 	if(jQuery('.vertical-scroll').scrollTop() + jQuery('.vertical-scroll').height() == jQuery('#report_result_body').height()) {
		// 		var mod = ReportResultTable;
		// 		var table = mod.current_table;
		// 		var msg_from = table.msg_from + table.msgs_per_page;
		// 		if (msg_from >= table.rows_count)
		// 			return; //msg_from = 0;
		// 		mod.show_table(mod.current_table_index, msg_from, msg_from + table.msgs_per_page - 1, 0, true);
		// 	}
		// });
		jQuery("#report_result_toolbar_table img").click(function() {
			var mod = ReportResultTable,
					msg_from;
			var type = parseInt(jQuery(this).attr("type"), 10);
			var table = mod.current_table;
			if (!table || table.msgs_per_page === -1)
				return;
			//first page
			if (type === 0 && table.msg_from !== 0) {
				mod.show_table(mod.current_table_index, 0, table.msgs_per_page);
			} else if (type === 1 && table.msg_from !== 0) { //prev page
				var curr_page = parseInt(table.msg_from / table.msgs_per_page, 10);
				if (!curr_page)
					return;
				msg_from = (curr_page - 1) * table.msgs_per_page;
				mod.show_table(mod.current_table_index, msg_from, msg_from + table.msgs_per_page - 1);
			} else if (type === 2) { //next page
				msg_from = table.msg_from + table.msgs_per_page;
				if (msg_from >= table.rows_count)
					return; //msg_from = 0;
				mod.show_table(mod.current_table_index, msg_from, msg_from + table.msgs_per_page - 1);
			} else if (type === 3) { //last page
				msg_from = table.rows_count % table.msgs_per_page ? parseInt(table.rows_count / table.msgs_per_page, 10) * table.msgs_per_page : (parseInt(table.rows_count / table.msgs_per_page, 10) - 1) * table.msgs_per_page;
				mod.show_table(mod.current_table_index, msg_from, msg_from + table.msgs_per_page - 1);
			}
		});
		jQuery("#report_result_toolbar_page").keydown(function(e) {
			var keynum = 0;
			if (window.event) {
				keynum = e.keyCode;
			} else if (e.which) {
				keynum = e.which;
			}
			if (keynum !== 13)
				return;
			var mod = ReportResultTable;
			var table = mod.current_table;
			if (!table || table.msgs_per_page === -1)
				return;
			var val = parseInt(jQuery(this).val(), 10);
			if (isNaN(val))
				return;
			jQuery(this).val(val);
			var msg_from = (val - 1) * table.msgs_per_page;
			if (msg_from > table.rows_count)
				return;
			mod.show_table(mod.current_table_index, msg_from, msg_from + table.msgs_per_page - 1);
		});
	},
	/// Clear current table
	clear_table: function(show_chart, keep_page, show_photo, show_toolbar) {
		if (!jQuery('#report_result_toolbars_container').is(':visible')) {
			jQuery('#report_result_toolbars_container').css('display', '');
		}
		if (!show_chart) {
			jQuery("#report_result_header").html('').css("display", "none");
			jQuery("#report_result_target").addClass("no-header");
			jQuery("#report_result_chart").css("display", "none");
			jQuery("#report_result_chart_result").html('');
			jQuery("#report_result_photo").css("display", "none");
			if (jQuery("#report_result_body_target").html()) {
				jQuery("#report_result_body_target").html("");
			}
			jQuery("#report_result_photo_toolbar").css("display", "none");
			jQuery("#report_result_body").html('').css("display", "");
			jQuery("#report_result_footer").html("").css("display", "none");
			jQuery("#report_result_target").addClass("no-footer");

			jQuery("#report_result_toolbar").css("display", "");
			jQuery("#report_result_chart_toolbar").css("display", "none");
			jQuery("#report_result_photo_toolbar").css("display", "none");
			if (!keep_page) {
				jQuery("#report_result_toolbar_page").val(0);
				jQuery("#report_result_toolbar_pages").html(0);
				jQuery("#report_result_toolbar_messages").html(0 + " " + 0 + " " + 0);
			}
		} else {
			jQuery("#report_result_header").css("display", "none");
			jQuery("#report_result_target").addClass("no-header");
			jQuery("#report_result_chart").css("display", "");
			jQuery("#report_result_chart_result").html('');
			jQuery("#report_result_photo").css("display", "none");
			if (jQuery("#report_result_body_target").html()) {
				jQuery("#report_result_body_target").html("");
			}
			jQuery("#report_result_photo_toolbar").css("display", "none");
			jQuery("#report_result_body").html('').css("display", "none");
			jQuery("#report_result_footer").html("").css("display", "none");
			jQuery("#report_result_target").addClass("no-footer");
			jQuery("#report_result_toolbar").css("display", "none");
			if (show_photo) {
				jQuery("#report_result_chart_toolbar").css("display", "none");
				jQuery("#report_result_photo_toolbar").css("display", "");
			} else {
				jQuery("#report_result_chart_toolbar").css("display", "");
				jQuery("#report_result_photo_toolbar").css("display", "none");
			}
		}
		if (show_toolbar) {
			jQuery("#report_result_toolbars_container").css('display', 'block');
			jQuery('#report_result_target').removeClass("no-toolbar");
		} else {
			jQuery("#report_result_toolbars_container").css('display', 'none');
			jQuery('#report_result_target').addClass("no-toolbar");
		}
	}
};

'use strict';

// Init underscore template system like Mustache.js
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

// Init core & inject document & jQuery & Underscore
/* global sensolator */
sensolator.core.startApp(document, jQuery, _);
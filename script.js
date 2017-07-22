var connections = [];
var arcarr = [];
var home = { latitude: -49.2159422, longitude: 69.0663163 }; // set home coordinates manually for fine tuning and -1 ip check
var map1;
var iconSize = 16;
var showArcs = true;
var showIcons = true;

function drawMap() {
	// setup map
	map1 = new Datamap({
		scope: 'world',
		element: document.getElementById('arcs'),
		projection: 'mercator',
		fills: {
          		//defaultFill: '#f0af0a',
          		defaultFill: '#eee'
        	},
        	data: {
          	//'FRA': {fillKey: 'defaultFill' }       
        	}
	});
	
	// paint connected countries
	var aux = {};
	for (var i = 0; i < connections.length; i++) {
		if (connections[i].countryCode) {
			aux[connections[i].countryCode] = "rgba(200,255,0,255)";
		}
	}
	// update country colors
	map1.updateChoropleth(aux);
	// draw arcs
	if (showArcs) {
		map1.arc( arcarr, {strokeWidth: 0.5});
	}
	
	
    
	function handleMarkers (layer, data, options ) {
		var self = this,
			fillData = this.options.fills,
			svg = this.svg;

		if ( !data || (data && !data.slice) ) {
			throw "Datamaps Error - markers must be an array";
		}

		var markers = layer.selectAll('image.datamaps-marker').data( data, JSON.stringify );
		

		markers
			.enter()
				.append('image')
				.attr('class', 'datamaps-marker')
				.attr('xlink:href', function( datum ) {
					return datum.iconUrl || options.defaultIcon;
				})
				.attr('height', iconSize)
				.attr('width', iconSize)
				.attr('x', function ( datum ) {
					var latLng;
					if ( datumHasCoords(datum) ) {
						latLng = self.latLngToXY(datum.latitude, datum.longitude);
					}
					else if ( datum.centered ) {
						latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
					}
					if ( latLng ) return latLng[0] - (iconSize/2);
				})
				.attr('y', function ( datum ) {
					var latLng;
					if ( datumHasCoords(datum) ) {
						latLng = self.latLngToXY(datum.latitude, datum.longitude);
					}
					else if ( datum.centered ) {
						latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
					}
					if ( latLng ) return latLng[1] - (iconSize/2);
				});

		markers.exit()
			.transition()
				.attr("height", 0)
				.remove();

		function datumHasCoords (datum) {
			return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
		}
	}

	map1.addPlugin('markers', handleMarkers)

             
	function setMarkers() {
		var auxm = [];
		for (var i = 0; i < connections.length; i++) {
			auxm.push({name: connections[i].countryCode, iconUrl: connections[i].icon, latitude: connections[i].lat, longitude: connections[i].lon});
		}
		map1.markers(auxm, {defaultIcon: 'icons/unk.png'});
	}
	if (showIcons) {
		setMarkers();
	}
	
	console.log("Connections:",arcarr.length);
	return
}

function getDatamapsCC(cc) {
	var countries = Datamap.prototype.worldTopo.objects.world.geometries;
	for (var i = 0; i < countries.length; i++) {
		if (countries[i].properties.name.indexOf(cc) > -1) {
			return countries[i].id;
		}
	}
	return;
}

function createArcs() {
	var i;
	for (i = 0; i < connections.length; i++) {
		var o;
		if (connections[i].direction == "inbound") {
			o = {
				destination: home,
				origin: {
					latitude: connections[i].lat,
					longitude: connections[i].lon
				},
				options: {
				  //strokeWidth: 2,
				  //strokeColor: 'rgba('+randomIntFromInterval(0,255)+', '+randomIntFromInterval(0,255)+', '+randomIntFromInterval(0,255)+', 0.4)',
				  strokeColor: 'rgba(255,0,0,255)',
				  greatArc: false
				}
			};
		} else { // outbound
			o = {
				origin: home,
				destination: {
					latitude: connections[i].lat,
					longitude: connections[i].lon
				},
				options: {
				  //strokeWidth: 2,
				  //strokeColor: 'rgba('+randomIntFromInterval(0,255)+', '+randomIntFromInterval(0,255)+', '+randomIntFromInterval(0,255)+', 0.4)',
				  strokeColor: 'rgba(0,100,0,255)',
				  greatArc: false
				}
			};
		}
		arcarr.push(o);
	}
	return;
}

function getIconFromVer(ver) {
	ver = ver.toLowerCase();
	if (ver.indexOf("bip148") > -1) {
		return "icons/uasf.png";
	}
	if (ver.indexOf("satoshi") > -1) {
		return "icons/core.png";
	}
	if (ver.indexOf("unlimited") > -1) {
		return "icons/unlimited.png";
	}
	if (ver.indexOf("knots") > -1) {
		return "icons/knots.png";
	}
	if (ver.indexOf("bitcoij") > -1) {
		return "icons/bitcoij.svg";
	}
	if (ver.indexOf("bitcore") > -1) {
		return "icons/bitcore.png";
	}
	if (ver.indexOf("bitnodes") > -1) {
		return "icons/bitnodes.png";
	}
	if (ver.indexOf("viabtc") > -1) {
		return "icons/viabtc.png";
	}
	return "icons/unk.png";
}

function locDataCallback(a, res) {
	var i, j;
	var jres = JSON.parse(res);
	for (i = 0; i < jres.length; i++) {
		connections[i].lat = jres[i].lat;
		connections[i].lon = jres[i].lon;
		connections[i].countryCode = getDatamapsCC(jres[i].country); // convert api country code to datamaps code
		connections[i].checked = true;
		connections[i].icon = getIconFromVer(connections[i].ver);
	}
	createArcs();
	drawMap();
	return;
}

function getLocationsData() {
	var i, c1;
	var allraw = [];
	for (i = 0; i < connections.length; i++) {
		c1 = connections[i];
		allraw.push({"query": c1.ip});
	}
	return JSON.stringify(allraw);
}

function addToConnections(jres) {
	var i, c1;
	for (i = 0; i < jres.in.length; i++) {
		c1 = jres.in[i];
		connections.push({ "ip": c1.ip, "direction": "inbound", "status": "new", "lat": 0.0, "lon": 0.0, "checked": false, "ver": c1.ver });
	}
	for (i = 0; i < jres.out.length; i++) {
		c1 = jres.out[i];
		connections.push({ "ip": c1.ip, "direction": "outbound", "status": "new", "lat": 0.0, "lon": 0.0, "checked": false, "ver": c1.ver });
	}
	return;
}

function rpcDataCallback(a, res) {
	var jres = JSON.parse(res);
	addToConnections(jres);
	var postData = getLocationsData();
	xdr("http://ip-api.com/batch?fields=lat,lon,country", "POST", postData, locDataCallback, xdrError);
	return;
}

function xdrError(a,b,c) {
	console.log(a,b,c);
	return;
}

xdr("getRPCData.php", "GET", "", rpcDataCallback, xdrError);

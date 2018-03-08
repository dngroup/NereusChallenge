/**
 * Created by mlacaud on 04/05/16.
 */

var radiusBase = 230,
    radiusUpLink = radiusBase-50,
    radiusDownLink = radiusBase-165,
    radiusTopServer = radiusBase+60,
    radiusTopSlider = radiusBase+90,
    links = [],
    sliders= [];

///////////////////////////////////
// Base circle
///////////////////////////////////
var path = new Path.Circle({
    center: view.center,
    radius: radiusBase,
    strokeColor: 'black',
});
//path.selected = true;
//path.flatten(radiusBase*2*3.14/8);
path.visible=false;


var path2 = new Path.Circle({
    center: view.center,
    radius: radiusUpLink,
    strokeColor: 'black',
});
path2.visible=false;


var path3 = new Path.Circle({
    center: view.center,
    radius: radiusDownLink,
    strokeColor: 'black',
});
path3.visible=false;


var path4 = new Path.Circle({
    center: view.center,
    radius: radiusTopServer,
    strokeColor: 'black',
});
path4.visible=false;


var path5 = new Path.Circle({
    center: view.center,
    radius: radiusTopSlider,
    strokeColor: 'black',
});
path5.visible=false;

///////////////////////////////////
// Man
///////////////////////////////////
var man = new Raster('programmer');
man.scale(2);










///////////////////////////////////
//
// Servers
//
///////////////////////////////////
var servers = [],
    serverCount = 9,
    i,
    serverOrig = new Raster('server');
for(i=0; i < serverCount; i++) {
    var j = i+1;
    if(i === 0){
        server = serverOrig;
        server.scale(0.2);
    } else {
        server = serverOrig.clone();
    }

    ///////////////////////////////////
    // Links
    ///////////////////////////////////
    var pointUpLink = path2.getPointAt(radiusUpLink*2*3.14*i/serverCount),
        pointDownLink = path3.getPointAt(radiusDownLink*2*3.14*i/serverCount);
    var link = new Path.Line({
        from: pointUpLink,
        to: pointDownLink,
        strokeColor: {
            gradient: {
                stops: ['#FAFAFA', '#A4A4A4', '#585858', '#424242', '#000000']
            },
            origin: pointUpLink,
            destination: pointDownLink
        },
        strokeWidth: 3
    });
    links.push(link);

    ////////////////////////////////////
    // Sliders
    ////////////////////////////////////
    var pointCenter = path5.getPointAt(radiusTopSlider*2*3.14*i/serverCount-50),
        pointTop = path5.getPointAt(radiusTopSlider*2*3.14*i/serverCount+50);
    if(i===0) pointCenter = path5.getPointAt(radiusTopSlider*2*3.14*serverCount/serverCount-50);
    var slider = new Path.Line({
        from: pointCenter,
        to: pointTop,
        strokeColor: 'lightgrey',
        strokeWidth: 20
    });

    sliders.push(slider);
    ////////////////////////////////////
    // Server ok init
    ////////////////////////////////////
    if(i>2) {
        server.opacity = 0.2;
        link.visible = false;
        slider.visible=false;
    }

    ////////////////////////////////////
    // onClick
    ////////////////////////////////////
    server.onClick = function(event){
        if(this.opacity !== 1){
            this.opacity = 1;
            links[servers.indexOf(this)].visible = true;
            sliders[servers.indexOf(this)].visible = true;
        } else {
            this.opacity = 0.2;
            links[servers.indexOf(this)].visible = false;
            sliders[servers.indexOf(this)].visible = false;
        }
    }

    ////////////////////////////////////
    // Push
    ////////////////////////////////////
    servers.push(server);

}
//////////////////////////////////////
//////////////////////////////////////







///////////////////////////////////
//
// Resize
//
///////////////////////////////////
function onResize(event) {


    path.position = view.center;
    path2.position = view.center;
    path3.position = view.center;
    path4.position = view.center;
    path5.position = view.center;
    man.position = view.center;

    for(i=0; i < serverCount; i++) {
        var j= i+1;
        var pointServer = path.getPointAt(radiusBase*2*3.14*i/serverCount),
            pointUpLink = path2.getPointAt(radiusUpLink*2*3.14*i/serverCount),
            pointDownLink = path3.getPointAt(radiusDownLink*2*3.14*i/serverCount);
        servers[i].position = pointServer;
        links[i].removeSegments();
        links[i].add(pointUpLink, pointDownLink);
        var pointSliderCenter = path5.getPointAt(radiusTopSlider*2*3.14*i/serverCount-50),
            pointSliderTop = path5.getPointAt(radiusTopSlider*2*3.14*i/serverCount+50);
        if(i===0) pointSliderCenter = path5.getPointAt(radiusTopSlider*2*3.14*serverCount/serverCount-50);
        sliders[i].removeSegments();
        sliders[i].add(pointSliderCenter, pointSliderTop);

    }
};


function onFrame(event){

    for(var i=0; i< serverCount; i++){
        var changement = 50,
            totalColor = 5;
        if(event.count%changement < changement/totalColor){
            links[i].strokeColor.gradient.stops[0].color = '#FAFAFA';
            links[i].strokeColor.gradient.stops[1].color = '#A4A4A4';
            links[i].strokeColor.gradient.stops[2].color = '#585858';
            links[i].strokeColor.gradient.stops[3].color = '#424242';
            links[i].strokeColor.gradient.stops[4].color = '#000000';
        }
        if(event.count%changement >= changement/totalColor && event.count%changement < changement*2/totalColor){
            links[i].strokeColor.gradient.stops[0].color = '#000000';
            links[i].strokeColor.gradient.stops[1].color = '#FAFAFA';
            links[i].strokeColor.gradient.stops[2].color = '#A4A4A4';
            links[i].strokeColor.gradient.stops[3].color = '#585858';
            links[i].strokeColor.gradient.stops[4].color = '#424242';
        }
        if(event.count%changement >= changement*2/totalColor && event.count%changement < changement*3/totalColor){
            links[i].strokeColor.gradient.stops[0].color = '#424242';
            links[i].strokeColor.gradient.stops[1].color = '#000000';
            links[i].strokeColor.gradient.stops[2].color = '#FAFAFA';
            links[i].strokeColor.gradient.stops[3].color = '#A4A4A4';
            links[i].strokeColor.gradient.stops[4].color = '#585858';
        }
        if(event.count%changement >= changement*3/totalColor && event.count%changement < changement*4/totalColor){
            links[i].strokeColor.gradient.stops[0].color = '#585858';
            links[i].strokeColor.gradient.stops[1].color = '#424242';
            links[i].strokeColor.gradient.stops[2].color = '#000000';
            links[i].strokeColor.gradient.stops[3].color = '#FAFAFA';
            links[i].strokeColor.gradient.stops[4].color = '#A4A4A4';
        }
        if(event.count%changement >= changement*4/totalColor && event.count%changement < changement*5/totalColor){
            links[i].strokeColor.gradient.stops[0].color = '#A4A4A4';
            links[i].strokeColor.gradient.stops[1].color = '#585858';
            links[i].strokeColor.gradient.stops[2].color = '#424242';
            links[i].strokeColor.gradient.stops[3].color = '#000000';
            links[i].strokeColor.gradient.stops[4].color = '#FAFAFA';
        }
    }

};

view.zoom=0.8;
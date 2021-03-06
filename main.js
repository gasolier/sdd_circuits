// variables are not documented unless there are special circumstances as they are all in the data dictionary
// this was also my first time using JavaScript and I've learnt A LOT if I was to do this again or if I refactor 
// the code at some point in time then I know a lot more tricks, the major issues are to do with violating DRY 
// and now that I know more about functional programming paradigms I can likely write neater code

let block_array = new Array();
let moving = false;
let block_to_move = null;
let connect_line = false;
let global_line_x = 0;
let global_line_y = 0;
let connector_block = null;
let output_connection = false;
let learn_frame = document.getElementById('learn');
let current_lesson = 0;
let sandbox_levels = [1,3,5,7,10];


// used to create the div element that connects gates together
function create_line (x1, y1, x2, y2) {
    let length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    // angle is in radians not degrees
    let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    let line = document.createElement('div');
    line.classList.add('line');
    line.style.setProperty('position', 'absolute');
    line.style.setProperty('left', x1 + 'px');
    line.style.setProperty('top', y1 + 'px');
    line.style.setProperty('transform', 'rotate(' + angle + 'deg)');
    line.style.setProperty('width', length + 'px');

    // setting the id allows us to quickly delete and re-create the line whenever the cursor is moved
    line.id = 'tester';

    viewer.appendChild(line);
}

function clear () {
    // go through every gate and remove it
    for (let i = 0; i < block_array.length; i++){
        viewer.removeChild(document.getElementById(i.toString()));
    }

    // getting the lines was a little more difficult as they aren't stored
    // strangely we can't use document.getElementsByClass as it returns a live HTML list and that has weird bugs
    // .line obviously refers to the `line` class
    let line_arr = document.querySelectorAll('.line');
    Array.prototype.forEach.call(line_arr, function(line_) {
        viewer.removeChild(line_);
    });

    // clear the array by setting its length to 0, this probably shouldn't work but it's fast and doesn't mess up references to the object
    block_array.length = 0;
}

function next_stage () {
    // if we've reached the last lesson break out of the function and disable the button
    if (current_lesson == 11) {
        next_lesson.disabled = true; 
        return;
    }
    else {
        next_lesson.disabled = false;
    }
    current_lesson += 1;

    // this is a weird JS thing, ~(statement) returns true for every value but -1
    // and if an element isn't in an array .indexOf() returns -1, so this works quite well
    if (~sandbox_levels.indexOf(current_lesson)) {
        learn.style.setProperty('display', 'none');
        sandbox.style.setProperty('display', 'inline');
    }
    else {
        // quite proud of this, using an iframe + files in different folders makes loading lessons on the same page very simple
        learn_frame.setAttribute('src', "lessons/" + current_lesson + "/lesson.html");
        sandbox.style.setProperty('display', 'none');
        learn.style.setProperty('display', 'inline');
        
    }

    // this handles setting the dropdown box to the right lesson number
    lesson_selector.value = document.getElementById('s' + (current_lesson + 1)).value;
    if (current_lesson == 11) {
        next_lesson.disabled = true; 
    }
    else {
        next_lesson.disabled = false;
    }
    clear();
}

function move_block (ev) {
    if (moving == true) {
        // use the CSS transform property to move the gate to the cursor + the default offset due to browser sizes + a small amount due to
        // position: absolute in the viewer div messing up offsets a little
        block_to_move.style.setProperty('transform', 
            'translate(' + (ev.pageX - viewer.offsetLeft - 28) + 'px, ' + (ev.pageY - viewer.offsetTop - 64) + 'px)');

        moving = false;

        block_to_move.style.setProperty('stroke', 'black');
        block_to_move = null;

        viewer.style.setProperty('cursor', 'default');

        connect_line = false;

        // stop the event from travelling past here, makes sure that if you drag one block the ones below it don't follow
        ev.stopPropagation();
    }
}

function clicked_block (ev, block) {
    if (block_to_move != null) {
        move_block(ev);
        return;
    }

    // if we aren't moving something already set the block we move to this one
    block.style.setProperty('stroke', 'red');
    moving = true;
    block_to_move = block;
    viewer.style.setProperty('cursor', 'pointer');

    ev.stopPropagation();
}

function clicked_switch (ev, block) {
    if (block_to_move != null) {
        move_block(ev);
        return;
    }

    // get the block by taking the clicked element's parent's id and using it to search the array for the object
    block = block_array[parseInt(block.parentElement.id)];
    
    // if the output is true make it false and vice-versa
    block.output = block.output ? false : true;
    block.update_self();

    ev.stopPropagation();
}

function clicked_input (ev, input_block) {
    if (block_to_move != null) {
        move_block(ev);
        return;
    }
    if (output_connection) {
        output_connector(ev, input_block);
        return;
    }

    // if we aren't connecting one gate to another just turn the input off or on like a switch
    parent_block = input_block.parentElement;
    if (output_connection == false) {
        if (input_block.id == '1') {
            block_array[parseInt(parent_block.id)].input_1 = block_array[parseInt(parent_block.id)].input_1 ? false : true;
        }
        else if (input_block.id == '2') {
            block_array[parseInt(parent_block.id)].input_2 = block_array[parseInt(parent_block.id)].input_2 ? false : true;
        }
        block_array[parseInt(parent_block.id)].update_self();
    }
    ev.stopPropagation();
}

function clicked_output (ev, output_block) {
    if (block_to_move != null) {
        move_block(ev);
        return;
    }

    // if we clicked the output and aren't moving start the process of connecting to another gate
    // this involves changing the global flag and creating the line that is going to be drawn
    // we also need to set the global variable which handles which gate will provide input to the connected block
    parent_block = output_block.parentElement;

    connector_block = block_array[parseInt(parent_block.id)];
    output_connection = true;

    connect_line = true;

    global_line_y = ev.pageY - viewer.offsetTop - 62;
    global_line_x = ev.pageX - viewer.offsetLeft;

    create_line(global_line_x, global_line_y, global_line_x, global_line_y);

    ev.stopPropagation();
}

function output_connector (ev, output_block) {
    if (block_to_move != null) {
        move_block(ev);
        return;
    }

    console.log("Connecting input to output...");
    console.log("Attempting to connect to a " + output_block.parentElement.classList[0]);
    if (output_connection) {
        // get the type of block we're attempting to form a connection with
        type = output_block.parentElement.classList[0];
        
        if (type == 'output-block') {
            // if we're attempting to connect to an arbitrary output block just set its input_block value to us
            output_block = block_array[parseInt(output_block.parentElement.id)];
            
            output_block.input_block = connector_block;
            connector_block.connected_children.push(output_block);

            connector_block.update_self();
        } else if (type != 'undef') {
            // if it isn't an arbitrary output we need to know which input we're connecting to
            if (output_block.id == "1") {
                // if it's 1 just set the block we're connecting to, to refer to us as it's first child
                output_block = block_array[parseInt(output_block.parentElement.id)];

                output_block.input_1_child = connector_block;
                connector_block.connected_children.push(output_block);
                
                connector_block.update_self();
            } else {
                // do the same for the second input
                output_block = block_array[parseInt(output_block.parentElement.id)];

                output_block.input_2_child = connector_block;
                connector_block.connected_children.push(output_block);
                
                connector_block.update_self();
            }
            
        }

        // make sure that the block we're connecting to and the one we're connecting from can no longer be moved
        connector_block.svg_wrapper.onmousedown = function (event) { /* do nothing here */ }
        output_block.svg_wrapper.onmousedown = function (event) { /* do nothing here */ }

        // remove the `tester` id from the line so it is no longer destroyed every mousemove event
        document.getElementById('tester').id = '';
        connect_line = false;
        
        // reset the connection handlers
        connector_block = null;
        output_connection = false;
    }
    
    ev.stopPropagation();
}


// all variables here are mentioned in the data dictionary and the other bits are pretty self-explanatory
// I will, however, go through the update_self() method with the AND gate to explain how it works
// it's close to the same for every prototype so there isn't much point in repeating it several times

function input_block () {
    console.log("Created Input");

    this.output = false;
    this.connected_children = new Array();

    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.setAttribute('draggable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.onmouseup = function (event) { move_block(event, this); }
    this.svg_wrapper.style = "fill: grey; stroke: black; stroke-width: 2; position: absolute; fill-rule: nonzero;";

    this.self_body = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_body.setAttribute('cx', '32');
    this.self_body.setAttribute('cy', '32');
    this.self_body.setAttribute('r', '31');
    this.self_body.setAttribute('fill', 'none');

    this.self_switch = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_switch.setAttribute('d', 'm37.9016,9.36019c-1.09164,-0.53457 -2.40645,-0.07557 -2.93852,1.03025c-0.52988,1.10582 -0.07256,2.43503 1.01908,2.97071c3.42443,1.68485 5.788,5.22903 5.7858,9.33668c-0.01099,5.72804 -4.59522,10.36248 -10.2601,10.37248c-5.66598,-0.01111 -10.2502,-4.64556 -10.2612,-10.37248c-0.0022,-4.10987 2.36247,-7.65739 5.7902,-9.3389c1.09384,-0.53568 1.54786,-1.86489 1.01908,-2.97071c-0.52988,-1.1036 -1.84249,-1.56593 -2.93633,-1.03025c-4.89424,2.39502 -8.2692,7.47179 -8.2714,13.33986c0.0022,8.18418 6.56193,14.81688 14.65964,14.8191c8.09661,-0.00222 14.65744,-6.63492 14.65854,-14.8191c-0.0022,-5.86585 -3.37276,-10.93929 -8.2648,-13.33764zm-6.39374,10.92928c1.21367,0 2.19757,-0.99357 2.19757,-2.22275l0,-10.37359c0,-1.22807 -0.98391,-2.22164 -2.19757,-2.22164c-1.21587,0 -2.19867,0.99468 -2.19867,2.22164l0,10.37248c0,1.22918 0.98281,2.22387 2.19867,2.22387z');
    this.self_switch.onmousedown = function (event) { clicked_switch(event, this); }
    this.self_switch.classList.add('trigger');

    this.self_input_catch = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_catch.setAttribute('cx', '32');
    this.self_input_catch.setAttribute('cy', '23');
    this.self_input_catch.setAttribute('r', '12');
    this.self_input_catch.onmousedown = function (event) { clicked_switch(event, this); }
    this.self_input_catch.classList.add('trigger');
    this.self_input_catch.style.setProperty('fill', 'white');

    this.self_output = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_output.setAttribute('cx', '32');
    this.self_output.setAttribute('cy', '50');
    this.self_output.setAttribute('r', '8');
    this.self_output.onmousedown = function (event) { clicked_output(event, this); }
    this.self_output.classList.add('trigger');
    this.self_output.style.setProperty('stroke', 'none');

    this.svg_wrapper.appendChild(this.self_body);
    this.svg_wrapper.appendChild(this.self_input_catch);
    this.svg_wrapper.appendChild(this.self_switch);
    this.svg_wrapper.appendChild(this.self_output);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("input-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = (depth=0) => {
        if (depth < 0) {
            return;
        }
        this.self_switch.style.setProperty('fill', this.output ? 'green' : 'grey');
        this.self_output.style.setProperty('fill', this.output ? 'green' : 'grey');

        this.connected_children.forEach( function(block) {
            block.update_self(depth+1);
        });
    }
}

function output_block () {
    console.log("Created Output")

    this.on = false;
    this.input_block = null;

    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.onmouseup = function (event) { move_block(event, this); }
    this.svg_wrapper.style = "fill: none; stroke: black; stroke-width: 2; position: absolute;";

    this.self_parent = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_parent.setAttribute('cx', '32');
    this.self_parent.setAttribute('cy', '32');
    this.self_parent.setAttribute('r', '31');


    this.self_shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_shape.setAttribute('d', 'm31.19546,41.23204c-1.96937,-0.56976 -3.11028,-2.91216 -2.97571,-5.03712c-0.05042,-2.77558 0.1844,-5.69621 -1.03262,-8.24833c-0.69368,-1.90551 -1.87538,-3.58791 -2.36852,-5.57367c-0.61366,-3.08076 0.14434,-6.57249 2.42824,-8.64072c2.5757,-2.40698 6.68889,-2.7207 9.52422,-0.67491c1.99978,1.50226 3.44267,3.98001 3.38906,6.68381c0.23465,2.02034 -0.49648,3.92064 -1.35658,5.65746c-0.61623,1.39843 -1.33589,2.76686 -1.89521,4.18088c-0.14745,2.89927 -0.06289,5.82513 -0.46283,8.69947c-0.66623,2.22728 -3.17701,3.74161 -5.25006,2.95313l0,0zm5.2014,-5.18394c-1.16877,-0.68707 -2.84828,-0.24037 -4.2068,-0.38829c-1.10973,0.24207 -3.08161,-0.49651 -3.67156,0.61139c1.34919,0.57559 2.93477,0.14412 4.37112,0.23935c1.14929,-0.12038 2.47157,0.11416 3.50724,-0.46245l0,0zm-0.08753,-1.29287c0.172,-1.74556 -2.35905,-0.85483 -3.38726,-1.11469c-1.3609,0.30041 -3.52666,-0.64304 -4.38256,0.69814c0.50718,1.34778 2.76907,0.3999 3.95683,0.69894c1.26663,-0.04895 2.58069,0.04951 3.81299,-0.28239l0,0zm0.01576,-3.05838c0.33413,-3.40041 2.24053,-6.23167 3.34442,-9.34218c0.90761,-3.72417 -0.88988,-7.97886 -4.14423,-9.54211c-3.2392,-1.75081 -7.55486,-0.42818 -9.38544,3.00249c-1.76377,2.83382 -1.42717,6.6842 0.2967,9.44007c1.23002,2.40849 2.21139,5.11512 2.05153,7.91805c2.55324,0 5.10648,0 7.65973,0c0.0591,-0.4921 0.11817,-0.98423 0.17728,-1.47632zm-5.65245,-4.81745c-1.0116,-1.91827 -2.05009,-3.85133 -2.75452,-5.93027c0.63333,-0.89408 0.81757,-1.88999 1.01431,-2.94049c1.77757,-0.38079 -0.22626,2.20919 1.45201,2.26755c1.48972,0.70688 0.8362,-3.43002 2.0739,-1.93886c-0.88846,1.63653 1.74517,3.26458 1.84182,0.92344c-0.12767,-1.76767 1.59183,-1.43648 0.92143,0.16716c0.05533,0.82494 1.28689,1.06144 1.30797,1.72493c-0.8866,2.09731 -1.65724,4.26263 -2.70707,6.27045c-0.23631,-0.77737 0.92941,-2.72573 1.3019,-3.86971c0.71877,-0.98888 1.33642,-3.65382 -0.53737,-3.29056c-1.08697,1.84897 -2.54917,-1.16549 -3.61346,0.60647c-0.90347,0.29391 -2.32444,-1.70642 -2.58653,0.21694c0.68046,2.28446 2.09634,4.2314 2.83715,6.49228c-0.25138,-0.16164 -0.39452,-0.44521 -0.55154,-0.69931l0,0zm-1.4199,-8.37227c-0.49192,-0.26183 0.20734,1.39194 -0.00001,0l0.00001,0zm2.94018,0.19533c-0.63856,-1.17859 -0.29609,1.43 0,0zm2.84987,0c-0.63856,-1.17859 -0.29609,1.43 0,0zm-13.26748,-8.70875c-1.12864,-1.24923 -2.37622,-2.42143 -3.35777,-3.79842c2.45212,2.21368 4.69651,4.70677 6.90634,7.20609c0.58681,0.8794 -1.02373,-0.82122 -1.32347,-1.10628c-0.75,-0.75751 -1.49017,-1.52654 -2.2251,-2.30139l0,0zm17.4285,3.57168c1.90768,-2.59229 3.68759,-5.30994 5.74435,-7.76414c-0.3444,1.05666 -1.45305,2.32102 -2.15013,3.40928c-1.16412,1.57949 -2.25226,3.2495 -3.58346,4.66566c-0.16615,0.19153 -0.41425,-0.26212 -0.01074,-0.3108l-0.00002,0l0,0zm-4.13208,-2.45927c0.65912,-2.05606 1.61519,-4.01318 2.68181,-5.8533c-0.02479,1.02081 -1.15602,2.95558 -1.69977,4.22134c-0.30759,0.50935 -0.56704,1.32167 -0.98204,1.63196zm-8.44067,-2.63682c-0.45914,-0.73039 -1.84127,-2.43106 -1.5832,-2.66299c1.33255,1.61132 2.68786,3.27445 3.6451,5.17997c-0.81519,-0.68185 -1.40174,-1.66666 -2.06189,-2.51698l0,0zm5.27686,-0.57482c-0.09292,-0.68593 0.19554,-3.96041 0.35579,-1.73697c0.00057,1.39309 0.1339,2.96137 -0.22165,4.22934c-0.15226,-0.81521 -0.11532,-1.66389 -0.13414,-2.49237z');

    this.self_input = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input.setAttribute('cx', '32');
    this.self_input.setAttribute('cy', '53');
    this.self_input.setAttribute('r', '8');
    this.self_input.setAttribute('fill', 'grey');
    this.self_input.setAttribute('stroke-width', '0');
    this.self_input.onmousedown = function (event) { output_connector(event, this); }
    this.self_input.classList.add("trigger");

    this.svg_wrapper.appendChild(this.self_parent);
    this.svg_wrapper.appendChild(this.self_shape);
    this.svg_wrapper.appendChild(this.self_input);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("output-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = () => {
        if (this.input_block.output) {
            this.on = true;
        } else {
            this.on = false;
        }
        
        this.self_input.setAttribute('fill', this.on ? 'green' : 'grey');
        this.self_shape.setAttribute('stroke', this.on ? 'green' : 'black');
    }

}

function and_block () {
    console.log("Created AND");
    
    this.input_1 = false;
    this.input_2 = false;
    this.output = false;

    this.input_1_child = null;
    this.input_2_child = null;

    this.connected_children = new Array();
    
    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.style = "fill: none; stroke: black; stroke-width: 2; position: absolute;";
    
    this.self_body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_body.setAttribute('d', 'm2.000002,3.000001l29.499998,0l0,0c16.292402,0 29.499998,13.207599 29.499998,29.499999c0,16.292402 -13.207597,29.499999 -29.499998,29.499999l-29.499998,0l0,-58.999999z');

    this.self_input_1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_1.setAttribute('cx', '12');
    this.self_input_1.setAttribute('cy', '15');
    this.self_input_1.setAttribute('r', '7');
    this.self_input_1.setAttribute('fill', 'grey');
    this.self_input_1.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_1.id = '1';
    this.self_input_1.setAttribute('stroke-width', '0');
    this.self_input_1.classList.add("trigger");

    this.self_input_2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_2.setAttribute('cx', '12');
    this.self_input_2.setAttribute('cy', '49');
    this.self_input_2.setAttribute('r', '7');
    this.self_input_2.setAttribute('fill', 'grey');
    this.self_input_2.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_2.id = '2';
    this.self_input_2.setAttribute('stroke-width', '0');
    this.self_input_2.classList.add("trigger");

    this.self_output = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_output.setAttribute('cx', '50');
    this.self_output.setAttribute('cy', '32');
    this.self_output.setAttribute('r', '7');
    this.self_output.setAttribute('fill', 'grey');
    this.self_output.setAttribute('stroke-width', '0');
    this.self_output.onmousedown = function (event) { clicked_output(event, this); }
    this.self_output.classList.add("trigger");
    
    this.svg_wrapper.appendChild(this.self_body);
    this.svg_wrapper.appendChild(this.self_input_1);
    this.svg_wrapper.appendChild(this.self_input_2);
    this.svg_wrapper.appendChild(this.self_output);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("and-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = () => {

        // use this to check whether or not our inputs are true or false
        if (this.input_1_child != null) {
            this.input_1 = this.input_1_child.output;
        }
        if (this.input_2_child != null) {
            this.input_2 = this.input_2_child.output;
        }

        // if both are true we output a value of `true` else output a `false`
        if (this.input_1 && this.input_2) {
            this.output = true;
        } else {
            this.output = false;
        }

        // if our inputs/output are true set the SVG elements that represent them to green, else use grey
        this.self_input_1.setAttribute('fill', this.input_1 ? 'green' : 'grey');
        this.self_input_2.setAttribute('fill', this.input_2 ? 'green' : 'grey');
        this.self_output.setAttribute('fill', this.output ? 'green' : 'grey');

        // for every object that is connected to us, call its update_self() method
        this.connected_children.forEach( function(block) {
            block.update_self();
        });
    }
}

function nand_block () {
    console.log("Created NAND");
    
    this.input_1 = false;
    this.input_2 = false;
    this.output = true;

    this.input_1_child = null;
    this.input_2_child = null;

    this.connected_children = new Array();
    
    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.style = "fill: none; stroke: black; stroke-width: 2; position: absolute;";
    
    this.self_body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_body.setAttribute('d', 'm1.52251,1.28473l24.83823,0l0,0c13.71778,0 24.83823,13.79344 24.83823,30.80851c0,17.01507 -11.12045,30.80851 -24.83823,30.80851l-24.83823,0l0,-61.61702z');
    this.self_not_circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_not_circle.setAttribute('cx', '50');
    this.self_not_circle.setAttribute('cy', '32');
    this.self_not_circle.setAttribute('r', '10');
    this.self_not_circle.setAttribute('fill', 'white');

    this.self_input_1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_1.setAttribute('cx', '12');
    this.self_input_1.setAttribute('cy', '15');
    this.self_input_1.setAttribute('r', '7');
    this.self_input_1.setAttribute('fill', 'grey');
    this.self_input_1.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_1.id = '1';
    this.self_input_1.setAttribute('stroke-width', '0');
    this.self_input_1.classList.add("trigger");

    this.self_input_2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_2.setAttribute('cx', '12');
    this.self_input_2.setAttribute('cy', '49');
    this.self_input_2.setAttribute('r', '7');
    this.self_input_2.setAttribute('fill', 'grey');
    this.self_input_2.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_2.id = '2';
    this.self_input_2.setAttribute('stroke-width', '0');
    this.self_input_2.classList.add("trigger");

    this.self_output = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_output.setAttribute('cx', '50');
    this.self_output.setAttribute('cy', '32');
    this.self_output.setAttribute('r', '7');
    this.self_output.setAttribute('fill', 'grey');
    this.self_output.setAttribute('stroke-width', '0');
    this.self_output.onmousedown = function (event) { clicked_output(event, this); }
    this.self_output.classList.add("trigger");
    
    this.svg_wrapper.appendChild(this.self_body);
    this.svg_wrapper.appendChild(this.self_not_circle);
    this.svg_wrapper.appendChild(this.self_input_1);
    this.svg_wrapper.appendChild(this.self_input_2);
    this.svg_wrapper.appendChild(this.self_output);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("and-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = () => {
        if (this.input_1_child != null) {
            this.input_1 = this.input_1_child.output;
        }
        if (this.input_2_child != null) {
            this.input_2 = this.input_2_child.output;
        }

        if (this.input_1 && this.input_2) {
            this.output = true;
        } else {
            this.output = false;
        }

        this.output = !this.output;

        this.self_input_1.setAttribute('fill', this.input_1 ? 'green' : 'grey');
        this.self_input_2.setAttribute('fill', this.input_2 ? 'green' : 'grey');
        this.self_output.setAttribute('fill', this.output ? 'green' : 'grey');

        this.connected_children.forEach( function(block) {
            block.update_self();
        });
    }
}

function or_block () {
    console.log("Created OR");
    
    this.input_1 = false;
    this.input_2 = false;
    this.output = false;

    this.input_1_child = null;
    this.input_2_child = null;

    this.connected_children = new Array();
    
    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.style = "fill: none; stroke: black; stroke-width: 2; position: absolute;";
    
    this.self_body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_body.setAttribute('transform', 'matrix(1.1475809876663297,0,0,1.7603468001816172,16.70346666868491,22.253061968687646)');
    this.self_body.setAttribute('d', 'm-13.67327,-11.97164l30.807,0c10.892,0 23.106,17.613 23.106,17.613s-12.213,17.613 -23.106,17.613l-30.807,0c6.8425,-12.521 5.0309,-24.362 0,-35.227l0,0.001z');

    this.self_input_1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_1.setAttribute('cx', '12');
    this.self_input_1.setAttribute('cy', '15');
    this.self_input_1.setAttribute('r', '7');
    this.self_input_1.setAttribute('fill', 'grey');
    this.self_input_1.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_1.id = '1';
    this.self_input_1.setAttribute('stroke-width', '0');
    this.self_input_1.classList.add("trigger");

    this.self_input_2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_2.setAttribute('cx', '12');
    this.self_input_2.setAttribute('cy', '49');
    this.self_input_2.setAttribute('r', '7');
    this.self_input_2.setAttribute('fill', 'grey');
    this.self_input_2.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_2.id = '2';
    this.self_input_2.setAttribute('stroke-width', '0');
    this.self_input_2.classList.add("trigger");

    this.self_output = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_output.setAttribute('cx', '50');
    this.self_output.setAttribute('cy', '32');
    this.self_output.setAttribute('r', '7');
    this.self_output.setAttribute('fill', 'grey');
    this.self_output.setAttribute('stroke-width', '0');
    this.self_output.onmousedown = function (event) { clicked_output(event, this); }
    this.self_output.classList.add("trigger");
    
    this.svg_wrapper.appendChild(this.self_body);
    this.svg_wrapper.appendChild(this.self_input_1);
    this.svg_wrapper.appendChild(this.self_input_2);
    this.svg_wrapper.appendChild(this.self_output);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("or-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = () => {
        if (this.input_1_child != null) {
            this.input_1 = this.input_1_child.output;
        }
        if (this.input_2_child != null) {
            this.input_2 = this.input_2_child.output;
        }

        if (this.input_1 || this.input_2) {
            this.output = true;
        } else {
            this.output = false;
        }

        this.self_input_1.setAttribute('fill', this.input_1 ? 'green' : 'grey');
        this.self_input_2.setAttribute('fill', this.input_2 ? 'green' : 'grey');
        this.self_output.setAttribute('fill', this.output ? 'green' : 'grey');

        this.connected_children.forEach( function(block) {
            block.update_self();
        });
    }
}

function nor_block () {
    console.log("Created NOR");
    
    this.input_1 = false;
    this.input_2 = false;
    this.output = true;

    this.input_1_child = null;
    this.input_2_child = null;

    this.connected_children = new Array();
    
    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.style = "fill: none; stroke: black; stroke-width: 2; position: absolute;";
    
    this.self_body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_body.setAttribute('d', 'm1.06006,1.49577l31.11176,0c10.99975,0 23.33458,30.67929 23.33458,30.67929s-12.33382,30.67929 -23.33458,30.67929l-31.11176,0c6.91019,-21.80977 5.08067,-42.43507 0,-61.36032l0,0.00174z');
    this.self_not_circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_not_circle.setAttribute('cx', '50');
    this.self_not_circle.setAttribute('cy', '32');
    this.self_not_circle.setAttribute('r', '10');
    this.self_not_circle.setAttribute('fill', 'white');

    this.self_input_1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_1.setAttribute('cx', '12');
    this.self_input_1.setAttribute('cy', '15');
    this.self_input_1.setAttribute('r', '7');
    this.self_input_1.setAttribute('fill', 'grey');
    this.self_input_1.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_1.id = '1';
    this.self_input_1.setAttribute('stroke-width', '0');
    this.self_input_1.classList.add("trigger");

    this.self_input_2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_2.setAttribute('cx', '12');
    this.self_input_2.setAttribute('cy', '49');
    this.self_input_2.setAttribute('r', '7');
    this.self_input_2.setAttribute('fill', 'grey');
    this.self_input_2.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_2.id = '2';
    this.self_input_2.setAttribute('stroke-width', '0');
    this.self_input_2.classList.add("trigger");

    this.self_output = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_output.setAttribute('cx', '50.35');
    this.self_output.setAttribute('cy', '32');
    this.self_output.setAttribute('r', '7');
    this.self_output.setAttribute('fill', 'green');
    this.self_output.setAttribute('stroke-width', '0');
    this.self_output.onmousedown = function (event) { clicked_output(event, this); }
    this.self_output.classList.add("trigger");
    
    this.svg_wrapper.appendChild(this.self_body);
    this.svg_wrapper.appendChild(this.self_not_circle);
    this.svg_wrapper.appendChild(this.self_input_1);
    this.svg_wrapper.appendChild(this.self_input_2);
    this.svg_wrapper.appendChild(this.self_output);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("or-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = () => {
        if (this.input_1_child != null) {
            this.input_1 = this.input_1_child.output;
        }
        if (this.input_2_child != null) {
            this.input_2 = this.input_2_child.output;
        }

        if (this.input_1 || this.input_2) {
            this.output = true;
        } else {
            this.output = false;
        }

        this.output = !this.output;

        this.self_input_1.setAttribute('fill', this.input_1 ? 'green' : 'grey');
        this.self_input_2.setAttribute('fill', this.input_2 ? 'green' : 'grey');
        this.self_output.setAttribute('fill', this.output ? 'green' : 'grey');

        this.connected_children.forEach( function(block) {
            block.update_self();
        });
    }
}

function xor_block () {
    console.log("Created XOR");
    
    this.input_1 = false;
    this.input_2 = false;
    this.output = true;

    this.input_1_child = null;
    this.input_2_child = null;

    this.connected_children = new Array();
    
    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.style = "fill: none; stroke: black; stroke-width: 2; position: absolute;";
    
    this.self_body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_body.setAttribute('d', 'm6.52357,1.22629l32.14319,0c11.36442,0 24.10818,30.71122 24.10818,30.71122s-12.74271,30.71122 -24.10818,30.71122l-32.14319,0c7.13928,-21.83246 5.2491,-42.47923 0,-61.42418l0,0.00174z');
    this.xor_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.xor_line.setAttribute('x1', '3.0241');
    this.xor_line.setAttribute('y1', '2.42169');
    this.xor_line.setAttribute('x2', '3.0241');
    this.xor_line.setAttribute('y2', '62.18072');

    this.self_input_1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_1.setAttribute('cx', '12');
    this.self_input_1.setAttribute('cy', '15');
    this.self_input_1.setAttribute('r', '7');
    this.self_input_1.setAttribute('fill', 'grey');
    this.self_input_1.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_1.id = '1';
    this.self_input_1.setAttribute('stroke-width', '0');
    this.self_input_1.classList.add("trigger");

    this.self_input_2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_2.setAttribute('cx', '12');
    this.self_input_2.setAttribute('cy', '49');
    this.self_input_2.setAttribute('r', '7');
    this.self_input_2.setAttribute('fill', 'grey');
    this.self_input_2.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_2.id = '2';
    this.self_input_2.setAttribute('stroke-width', '0');
    this.self_input_2.classList.add("trigger");

    this.self_output = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_output.setAttribute('cx', '50');
    this.self_output.setAttribute('cy', '32');
    this.self_output.setAttribute('r', '7');
    this.self_output.setAttribute('fill', 'grey');
    this.self_output.setAttribute('stroke-width', '0');
    this.self_output.onmousedown = function (event) { clicked_output(event, this); }
    this.self_output.classList.add("trigger");
    
    this.svg_wrapper.appendChild(this.self_body);
    this.svg_wrapper.appendChild(this.xor_line);
    this.svg_wrapper.appendChild(this.self_input_1);
    this.svg_wrapper.appendChild(this.self_input_2);
    this.svg_wrapper.appendChild(this.self_output);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("or-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = () => {
        if (this.input_1_child != null) {
            this.input_1 = this.input_1_child.output;
        }
        if (this.input_2_child != null) {
            this.input_2 = this.input_2_child.output;
        }

        if ((this.input_1 && !this.input_2) || (this.input_2 && !this.input_1)) {
            this.output = true;
        } else {
            this.output = false;
        }

        this.self_input_1.setAttribute('fill', this.input_1 ? 'green' : 'grey');
        this.self_input_2.setAttribute('fill', this.input_2 ? 'green' : 'grey');
        this.self_output.setAttribute('fill', this.output ? 'green' : 'grey');

        this.connected_children.forEach( function(block) {
            block.update_self();
        });
    }
}

function not_block () {
    console.log("Created NOT");
    
    this.input_1 = false;
    this.output = true;

    this.input_1_child = null;

    this.connected_children = new Array();
    
    this.svg_wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg_wrapper.setAttribute('height', '64');
    this.svg_wrapper.setAttribute('width', '64');
    this.svg_wrapper.setAttribute('clickable', 'true');
    this.svg_wrapper.onmousedown = function (event) { clicked_block(event, this); }
    this.svg_wrapper.style = "fill: none; stroke: black; stroke-width: 2; position: absolute;";
    
    this.self_body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.self_body.setAttribute('transform', 'rotate(89.93875885009766 27.232807159423828,31.793884277343754)');
    this.self_body.setAttribute('d', 'm-2.690265,57.409764l29.923073,-51.231755l29.923073,51.231755l-59.846147,0z');
    this.self_not_circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_not_circle.setAttribute('cx', '50');
    this.self_not_circle.setAttribute('cy', '32');
    this.self_not_circle.setAttribute('r', '10');
    this.self_not_circle.setAttribute('fill', 'white');

    this.self_input_1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_input_1.setAttribute('cx', '12');
    this.self_input_1.setAttribute('cy', '32');
    this.self_input_1.setAttribute('r', '7');
    this.self_input_1.setAttribute('fill', 'grey');
    this.self_input_1.onmousedown = function (event) { clicked_input(event, this); }
    this.self_input_1.id = '1';
    this.self_input_1.setAttribute('stroke-width', '0');
    this.self_input_1.classList.add("trigger");

    this.self_output = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.self_output.setAttribute('cx', '50');
    this.self_output.setAttribute('cy', '32');
    this.self_output.setAttribute('r', '7');
    this.self_output.setAttribute('fill', 'green');
    this.self_output.setAttribute('stroke-width', '0');
    this.self_output.onmousedown = function (event) { clicked_output(event, this); }

    this.self_output.classList.add("trigger");
    
    this.svg_wrapper.appendChild(this.self_body);
    this.svg_wrapper.appendChild(this.self_not_circle);
    this.svg_wrapper.appendChild(this.self_input_1);
    this.svg_wrapper.appendChild(this.self_output);
    this.svg_wrapper.id = block_array.length;
    this.svg_wrapper.classList.add("not-block");
    this.svg_wrapper.classList.add("draggable");
    
    viewer.appendChild(this.svg_wrapper);

    this.update_self = () => {
        if (this.input_1_child != null) {
            this.input_1 = this.input_1_child.output;
        }

        if (this.input_1) {
            this.output = false;
        } else {
            this.output = true;
        }

        this.self_input_1.setAttribute('fill', this.input_1 ? 'green' : 'grey');
        this.self_output.setAttribute('fill', this.output ? 'green' : 'grey');

        this.connected_children.forEach( function(block) {
            block.update_self();
        });
    }
}

// set up the button functions that create our gates, we use promises here not anonymous functions because that's the only way I knew
// how to do it at the time
create_and.onclick = () => {
    block_array.push(new and_block());
}

create_or.onclick = () => {
    block_array.push(new or_block());
}

create_xor.onclick = () => {
    block_array.push(new xor_block());
}

create_not.onclick = () => {
    block_array.push(new not_block());
}

create_nor.onclick = () => {
    block_array.push(new nor_block());
}

create_nand.onclick = () => {
    block_array.push(new nand_block());
}

create_output.onclick = () => {
    block_array.push(new output_block());
}

create_input.onclick = () => {
    block_array.push(new input_block());
}

clear_screen.onclick = () => {
    clear();
}

// if the dropdown box changes do the same thing as the next_stage() function, we had to use this instead of re-using that function
// because of slight differences in how they calculate the current_lesson value
lesson_selector.onchange = () => {
    let selected_lesson = parseInt(lesson_selector.value) - 1;
    current_lesson = selected_lesson;
    if (~sandbox_levels.indexOf(current_lesson)) {
        learn.style.setProperty('display', 'none');
        sandbox.style.setProperty('display', 'inline');
    }
    else {
        learn_frame.setAttribute('src', "lessons/" + current_lesson + "/lesson.html");
        sandbox.style.setProperty('display', 'none');
        learn.style.setProperty('display', 'inline');
    }
    if (current_lesson == 11) {
        next_lesson.disabled = true; 
    }
    else {
        next_lesson.disabled = false; 
    }
    clear();
}

next_lesson.onclick = () => {
    next_stage();  
}

support_email.onclick = () => {
    window.open('mailto:ochandle@as.edu.au?subject=Support with Circuit Simulator');
}

sandbox.onclick = move_block;

sandbox.onmousemove = (ev) => {
    if (connect_line) {
        // if the mouse moves and we're creating a line delete the old one and draw a new one at the same start and a different end
        viewer.removeChild(document.getElementById('tester'));
        create_line(global_line_x, global_line_y, ev.pageX - viewer.offsetLeft, ev.pageY - viewer.offsetTop - 62);
    }
    if (moving) {
        // if we're currently moving a block change its transform value to the mouse position
        block_to_move.style.setProperty('transform', 
            'translate(' + (ev.pageX - viewer.offsetLeft - 28) + 'px, ' + (ev.pageY - viewer.offsetTop - 64) + 'px)');
    }
}

// when we are loaded set all values to the first and load the first lesson
lesson_selector.value = document.getElementById('s' + (current_lesson + 1)).value;
learn_frame.setAttribute('src', "lessons/" + current_lesson + "/lesson.html");

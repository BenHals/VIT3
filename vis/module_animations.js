
function makeBaseAnimation(vis, speed, reps){
    let durations = {
        "fadein_duration": 2000 / speed,
        "drop_duration": 2000 / speed,
        "distdrop_duration": 3000 / speed,
        "delay": 1000 / speed,
    }
    let animation = {
        total_duration: Object.keys(durations).map((k) => durations[k]).reduce((a, b) => a + b, 0),
        start: function(){
            let self = this;
            this.speed = speed;
            this.reps = reps;
            this.vis_options = vis.options;
            this.include_distribution = vis.include_distribution;
            this.sample_id_num = vis.current_sample; 
            this.sample_id = `sample_${vis.current_sample}`;
            this.sample_data = vis.samples[vis.current_sample];
            let sample_data_ids = this.sample_data.all.map(e => e.id);
            vis.initSample(vis.current_sample);
            vis.current_sample++;
            this.sample_elements = document.querySelectorAll(`#${this.sample_id} .datapoint`);
            this.population_elements = document.querySelectorAll(`#population .datapoint`);
            this.matched_population_elements = [...this.population_elements].filter((e) => {return sample_data_ids.includes(parseInt(e.dataset.did))});
            this.props1 = document.querySelectorAll(`#${this.sample_id} .prop1`);
            this.props2 = document.querySelectorAll(`#${this.sample_id} .prop2`);
            this.stats = document.querySelectorAll(`#${this.sample_id}_stats *`);
            this.analysis = document.querySelectorAll(`#${this.sample_id}_analysis *`);
            let distribution_container = document.querySelector(`#distribution-${this.sample_id_num}`);
            this.distributions = distribution_container.querySelectorAll('*');
            for(dist of this.distributions){
                // dist.style['fill-opacity'] = 0;
                // dist.style['stroke-opacity'] = 0;
                dist.setAttribute('data-r', dist.getAttribute('r'));
                dist.setAttribute('r', 0);
                dist.setAttribute('data-x1', dist.getAttribute('x1'));
                dist.setAttribute('x1', parseFloat(dist.getAttribute('x1')) + (parseFloat(dist.getAttribute('x2')) - parseFloat(dist.getAttribute('x1')))/2);
                dist.setAttribute('data-x2', dist.getAttribute('x2'));
                dist.setAttribute('x2', parseFloat(dist.getAttribute('data-x1')) + (parseFloat(dist.getAttribute('x2')) - parseFloat(dist.getAttribute('data-x1')))/2);
            }
            this.animation_controller = anime.timeline({
                // duration: this.total_duration,
                autoplay: false,
                // easing: this.total_duration < 1000 ? 'linear' : `easeOutElastic(${linearScale(reps, [1, 5], [1, 2])}, 0.6)`
                easing: this.total_duration < 500 ? 'linear' : `easeOutElastic(${1}, ${linearScale(reps, [1, 5], [0.6, 1.2])})`
                
            });
            addFadeInAnimation(this, durations);
            addSampleDropAnimation(this, durations);
            addSampleExtrasAnimation(this, durations);
            addDistDropAnimation(this, durations);

            this.total_duration = this.animation_controller.duration;

        },
        percentUpdate: function(p){
            this.animation_controller.seek(p * this.animation_controller.duration);
            return p >= 1;
        },
        remove: function(){
            this.animation_controller.seek(0);
            if(this.include_distribution){
                for(dist of this.distributions){
                    // dist.style['fill-opacity'] = 1;
                    // dist.style['stroke-opacity'] = 1;
                    dist.setAttribute('r', dist.getAttribute('data-r'));
                    dist.setAttribute('x1', dist.getAttribute('data-x1'));
                    dist.setAttribute('x2', dist.getAttribute('data-x2'));
                }
            }
        }
    }
    
    return animation;
}

function addFadeInAnimation(animation, durations){
    animation.animation_controller.add({
        targets: animation.matched_population_elements,
        'fill-opacity': (el) => {return [anime.get(el, 'fill-opacity'), 1]},
        'stroke-opacity': (el) => {return [anime.get(el, 'stroke-opacity'), 1]},
        fill: function(el, i) {
            let original_color_str = anime.get(el, 'fill');
            let new_color = null;
            if(d3.hsl(original_color_str).s < 0.2){
                new_color_str = d3.color('red');
            }else{
                new_color_str = d3.color(original_color_str).brighter().brighter();
            }
            return [d3.color(original_color_str).toString(), new_color_str.toString()]
        },
        delay: anime.stagger(50),
        duration: durations.fadein_duration,
    });
}
function addDistDropAnimation(animation, durations){
    if(vis.include_distribution){
        if(animation.vis_options.Analysis == "Point Value"){
            let main_stat_mark = document.querySelector(`#dynamicSVG #factor_0_mainstatmark`);
            let distribution_element = animation.distributions[0];
            animation.animation_controller.add({
                targets: main_stat_mark,
                'y1': (el) => [anime.get(el, 'y1'), anime.get(distribution_element, 'cy')],
                'y2': (el) => [anime.get(el, 'y2'), anime.get(distribution_element, 'cy')],
                'stroke': [
                    {value: (el) => [d3.color(anime.get(el, 'fill')).toString(), d3.color('red').toString()] },
                    {value: d3.color('red').toString() },
                    {value: d3.color('red').toString() },
                    {value: d3.color('red').toString() },
                ],
                duration: durations.distdrop_duration,  
                easing: 'easeInQuint'
            });
        }else if(animation.vis_options.Analysis == "Difference"){
            let main_stat_arrow = document.querySelectorAll(`#${animation.sample_id}_analysis line`);
            let main_stat_mark = document.querySelector(`#${animation.sample_id}_analysis #arrow_main_line`);
            let arrow_y = main_stat_mark.getAttribute('y1');
            let distribution_element = animation.distributions[0];
            let dist_y = distribution_element.getAttribute('cy');
            let y_delta = parseFloat(dist_y) - parseFloat(arrow_y);
            let x_delta = parseFloat(distribution_element.getAttribute('cx')) - parseFloat(main_stat_mark.getAttribute('x2'));

            animation.animation_controller.add({
                targets: main_stat_arrow,
                'y1': (el) => [anime.get(el, 'y1'), parseFloat(anime.get(el, 'y1')) + y_delta],
                'y2': (el) => [anime.get(el, 'y2'), parseFloat(anime.get(el, 'y2')) + y_delta],
                'x1': (el) => [anime.get(el, 'x1'), parseFloat(anime.get(el, 'x1')) + x_delta],
                'x2': (el) => [anime.get(el, 'x2'), parseFloat(anime.get(el, 'x2')) + x_delta],
                'stroke': [
                    {value: (el) => [d3.color(anime.get(el, 'fill')).toString(), d3.color('red').toString()] },
                    {value: d3.color('red').toString() },
                    {value: d3.color('red').toString() },
                    {value: d3.color('red').toString() },
                ],
                duration: durations.distdrop_duration,  
                easing: 'easeInQuint'
            });
        }else if(animation.vis_options.Analysis == "Average Deviation" || animation.vis_options.Analysis == "F Stat"){
            let main_stat_mark = document.querySelectorAll(`#${animation.sample_id}_analysis .arrow:not(.avg-dev)`);
            let distribution_element = animation.distributions[0];
            let avg_dev_mark = document.querySelectorAll(`#${animation.sample_id}_analysis .avg-dev`);
            let main_avg_dev_mark= document.querySelector(`#${animation.sample_id}_analysis .avg-dev#arrow_main_line`);
            let arrow_y = main_avg_dev_mark.getAttribute('y1');
            let dist_y = distribution_element.getAttribute('cy');
            let y_delta = parseFloat(dist_y) - parseFloat(arrow_y);
            let x_delta = parseFloat(distribution_element.getAttribute('cx')) - parseFloat(main_avg_dev_mark.getAttribute('x2'));
            animation.animation_controller.add({
                targets: main_stat_mark,
                'y1': (el) => [anime.get(el, 'y1'), parseFloat(anime.get(el, 'data-select-y'))],
                'y2': (el) => [anime.get(el, 'y2'), parseFloat(anime.get(el, 'data-select-y'))],
                'x1': (el) => [anime.get(el, 'x1'), parseFloat(anime.get(el, 'x1')) + parseFloat(anime.get(el, 'data-select-x-delta'))],
                'x2': (el) => [anime.get(el, 'x2'), parseFloat(anime.get(el, 'x2')) + parseFloat(anime.get(el, 'data-select-x-delta'))],
                'stroke': [
                    {value: (el) => d3.color(anime.get(el, 'stroke')).toString() },
                    {value: (el) => d3.color(anime.get(el, 'stroke')).toString() },
                    {value: (el) => d3.color(anime.get(el, 'stroke')).toString() },
                    {value: (el) => d3.color('black').toString() },
                ],
                duration: durations.distdrop_duration,  
                easing: 'easeInQuint'
            });
            animation.animation_controller.add({
                targets: avg_dev_mark,
                'y1': (el) => [anime.get(el, 'y1'), parseFloat(anime.get(el, 'y1')) + y_delta],
                'y2': (el) => [anime.get(el, 'y2'), parseFloat(anime.get(el, 'y2')) + y_delta],
                'x1': (el) => [anime.get(el, 'x1'), parseFloat(anime.get(el, 'x1')) + x_delta],
                'x2': (el) => [anime.get(el, 'x2'), parseFloat(anime.get(el, 'x2')) + x_delta],
                'stroke-opacity': [
                    {value: [0, 1] },
                    {value: 1 },
                    {value: 1 },
                    {value: 1 },
                ],
                duration: durations.distdrop_duration,  
                easing: 'easeInQuint'
            });
        }else if(animation.vis_options.Analysis == "Confidence Interval"){
            let main_stat_mark = document.querySelector(`#${animation.sample_id}_analysis #analysis-ci-line`);
            let distribution_element = animation.distributions[0];

            animation.animation_controller.add({
                targets: main_stat_mark,
                'y1': (el) => [anime.get(el, 'y1'), parseFloat(anime.get(distribution_element, 'y1'))],
                'y2': (el) => [anime.get(el, 'y2'), parseFloat(anime.get(distribution_element, 'y2'))],
                'x1': (el) => [anime.get(el, 'x1'), parseFloat(anime.get(distribution_element, 'data-x1'))],
                'x2': (el) => [anime.get(el, 'x2'), parseFloat(anime.get(distribution_element, 'data-x2'))],
                'stroke': [
                    {value: (el) => [d3.color(anime.get(el, 'stroke')).toString(), d3.color(anime.get(distribution_element, 'stroke')).toString()] },
                    {value: d3.color(anime.get(distribution_element, 'stroke')).toString() },
                    {value: d3.color(anime.get(distribution_element, 'stroke')).toString() },
                    {value: d3.color(anime.get(distribution_element, 'stroke')).toString() },
                ],
                duration: durations.distdrop_duration,  
                easing: 'easeInQuint'
            });
        }
        animation.animation_controller.add({
            targets: [animation.distributions],
            // 'fill-opacity': [0, 1],
            // 'stroke-opacity': [0, 1],
            r: (el) => [0, anime.get(el, 'data-r')],
            'x1': (el) => [anime.get(el, 'x1'), anime.get(el, 'data-x1')],
            'x2': (el) => [anime.get(el, 'x2'), anime.get(el, 'data-x2')],
            'fill': (el) => [d3.color(anime.get(el, 'fill')).toString(), d3.color('red').toString()],
            duration: durations.fadein_duration,  
            easing: 'easeOutElastic(1, 0.3)'
        });
    }
    animation.animation_controller.add({
        duration: durations.delay,
    });
}
function addSampleExtrasAnimation(animation, durations){
    if(animation.props1.length > 0){
        animation.animation_controller.add({
            targets: [animation.props1],
            'fill-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'fill-opacity') || 1, anime.get(el, 'fill-opacity') || 1]},
            'stroke-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'stroke-opacity') || 1, anime.get(el, 'stroke-opacity') || 1]},
            duration: durations.fadein_duration,
            easing: 'easeInOutQuad',
        });
    }
    if(animation.props2.length > 0){
        animation.animation_controller.add({
            targets: [animation.props2],
            'fill-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'fill-opacity') || 1, anime.get(el, 'fill-opacity') || 1]},
            'stroke-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'stroke-opacity') || 1, anime.get(el, 'stroke-opacity') || 1]},
            duration: durations.fadein_duration,  
            easing: 'easeInOutQuad',
        });
    }
    // animation.animation_controller.add({
    //     targets: [animation.stats],
    //     'fill-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'fill-opacity') || 1, anime.get(el, 'fill-opacity') || 1]},
    //     'stroke-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'stroke-opacity') || 1, anime.get(el, 'stroke-opacity') || 1]},
    //     duration: durations.fadein_duration,  
    //     easing: 'easeInOutQuad',
    // });
    animation.animation_controller.add({
        targets: [animation.stats],
        'fill-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'fill-opacity') || 1, anime.get(el, 'fill-opacity') || 1]},
        // 'stroke-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'stroke-opacity') || 1, anime.get(el, 'stroke-opacity') || 1]},
        'stroke-width': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'stroke-width') || 4, anime.get(el, 'stroke-width') || 4]},
        duration: durations.fadein_duration,  
        easing: 'easeOutElastic(1, 0.3)',
    });
    animation.animation_controller.add({
        targets: [animation.analysis],
        'fill-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'fill-opacity') || 1, anime.get(el, 'fill-opacity') || 1]},
        // 'stroke-opacity': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'stroke-opacity') || 1, anime.get(el, 'stroke-opacity') || 1]},
        'stroke-width': (el) => {return [animation.reps <= 10 ? 0 : anime.get(el, 'stroke-width') || 4, anime.get(el, 'stroke-width') || 4]},
        duration: durations.fadein_duration,  
        easing: 'easeOutElastic(1, 0.3)',
    });
}
function addSampleDropAnimation(animation, durations){
    if(vis.module.name == "Randomisation Variation" || vis.module.name == "Randomisation Test"){
        animation.animation_controller.add({
            targets: animation.sample_elements,
            'fill-opacity': [0, 1],
            'stroke-opacity': [0, 1],
            'fill': function(el, i){
                let new_color = d3.color(anime.get(animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did), 'fill'));
                return [animation.reps <= 10 ? new_color.toString() : d3.color('white'), animation.reps <= 10 ? new_color.toString() : d3.color('white')]
            },
            duration: animation.reps <= 10 ? durations.drop_duration : 1,

        }, `-=${durations.fadein_duration}`);
        animation.animation_controller.add({
            targets: animation.sample_elements,
            cy: function(el, i){
                return [(animation.reps <= 10 ? animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did).getAttribute('cy') : vis.areas['sec1display'].split(2, 1)[1]), vis.areas['sec1display'].split(2, 1)[1]];
            },
            cx: function(el, i){
                return [(animation.reps <= 10 ? animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did).getAttribute('cx') : el.getAttribute('cx')), el.getAttribute('cx')];
            },
            r: function(el, i){
                return [(animation.reps <= 10 ? animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did).getAttribute('r') : el.getAttribute('r')), el.getAttribute('r')];
            },
            delay: animation.reps <= 10 ? anime.stagger(50) : 0,
            duration: animation.reps <= 10 ? durations.drop_duration : 1,  
        });
        animation.animation_controller.add({
            targets: animation.sample_elements,
            'fill': function(el, i){
                let old_color = d3.color(anime.get(animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did), 'fill'));
                let new_color = d3.color('white');
                return [animation.reps <= 10 ? old_color.toString() : new_color.toString(), new_color.toString()]
            },
            duration: animation.reps <= 10 ? durations.drop_duration : 1,
        });
        animation.animation_controller.add({
            targets: animation.sample_elements,
            cy: function(el, i){
                return [(vis.areas['sec1display'].split(2, 1)[1]), el.getAttribute('data-cy')];
            },
            'fill': function(el, i){
                let new_color = d3.color(anime.get(el, 'data-fill'));
                return [d3.color('white'), new_color.toString()]
            },
            delay: animation.reps <= 10 ? anime.stagger(50) : 0,
            duration: durations.drop_duration,  
        });
    }else{
        animation.animation_controller.add({
            targets: animation.sample_elements,
            'fill-opacity': [0, 1],
            'stroke-opacity': [0, 1],
            'fill': function(el, i){
                let original_color_str = anime.get(el, 'fill');
                let new_color = null;
                if(original_color_str == 'grey'){
                    new_color_str = d3.color('red');
                }else{
                    new_color_str = d3.color(original_color_str).brighter().brighter();
                }
                return [new_color_str.toString(), new_color_str.toString()]
            },
            duration: animation.reps <= 10 ? durations.drop_duration : 1,

        }, `-=${durations.fadein_duration}`);
        animation.animation_controller.add({
            targets: animation.sample_elements,
            cy: function(el, i){
                return [(animation.reps <= 10 ? animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did).getAttribute('cy') : el.getAttribute('cy')), el.getAttribute('cy')];
            },
            cx: function(el, i){
                return [(animation.reps <= 10 ? animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did).getAttribute('cx') : el.getAttribute('cx')), el.getAttribute('cx')];
            },
            r: function(el, i){
                return [(animation.reps <= 10 ? animation.matched_population_elements.find((pel) => pel.dataset.did == el.dataset.did).getAttribute('r') : el.getAttribute('r')), el.getAttribute('r')];
            },
            delay: animation.reps <= 10 ? anime.stagger(50) : 0,
            duration: durations.drop_duration,  
        });
    }
}
function makeCIAnimation(vis, speed, tail_only, large){
    let ci_id = large ? 'large-ci' : 'ci';
    let ci_selector = large ? '.large-ci' : '.ci';
    let option_ci_elements = {
        'Point Value': [`left-${ci_id}-arrow`, `left-${ci_id}-text`, `right-${ci_id}-arrow`, `right-${ci_id}-text`, `top-${ci_id}-arrow`, `tops1-${ci_id}-arrow`, `tops2-${ci_id}-arrow`],
        'Difference': (!tail_only ? [`left-${ci_id}-arrow`, `left-${ci_id}-text`, `right-${ci_id}-arrow`, `right-${ci_id}-text`, `top-${ci_id}-arrow`, `pop-${ci_id}-arrow`, `arrow_main_line`, `arrow_arm_1`, `arrow_arm_2`, `pop-${ci_id}-text`] : [`pop-${ci_id}-arrow`, `arrow_main_line`, `arrow_arm_1`, `arrow_arm_2`, `pop-${ci_id}-text`, `tail-${ci_id}-text`]),
        'Average Deviation': [`pop-${ci_id}-arrow`, `arrow_main_line`, `arrow_arm_1`, `arrow_arm_2`, `pop-${ci_id}-text`, `tail-${ci_id}-text`],
        'F Stat': [`pop-${ci_id}-arrow`, `arrow_main_line`, `arrow_arm_1`, `arrow_arm_2`, `pop-${ci_id}-text`, `tail-${ci_id}-text`],
        'Confidence Interval': []
    };
    let animation = {
        total_duration: 1000 / speed,
        start: function(){
            vis.hideCI();
            let ci = document.querySelectorAll(ci_selector);
            for(let e of ci){
                e.setAttribute('data-y1', e.getAttribute('y1'));
                e.setAttribute('data-y2', e.getAttribute('y2'));
                e.setAttribute('data-x1', e.getAttribute('x1'));
                e.setAttribute('data-x2', e.getAttribute('x2'));
            }
            this.dist_datapoints = document.querySelectorAll('#distribution-container .distribution');
            this.ci_top_bar = document.querySelector('#tops2-ci-arrow');
            this.ci_main_bar = document.querySelector('#top-ci-arrow');
            this.selected_elements = [];
            for(g of ci){
                if (option_ci_elements[vis.options.Analysis].includes(g.id)){
                    this.selected_elements.push(g);
                    g.style.display = null;
                    g.style.strokeOpacity = 0;
                    g.style.fillOpacity = 0;
                }
            }
            this.animation_controller = anime.timeline({
                // duration: this.total_duration,
                autoplay: false,
                // easing: this.total_duration < 1000 ? 'linear' : `easeOutElastic(${linearScale(reps, [1, 5], [1, 2])}, 0.6)`
                easing: `easeOutElastic(${1}, ${linearScale(1, [1, 5], [0.6, 1.2])})`
                
            });
            let dist_faded = false;
            if(this.selected_elements.includes(this.ci_main_bar)){
                this.animation_controller.add({
                    targets: this.dist_datapoints,
                    'stroke-opacity': (el) => [anime.get(el, 'stroke-opacity'), el.dataset.inci == 'true' ? 0.8 : 0.2],
                    'fill-opacity': (el) => [anime.get(el, 'fill-opacity'), el.dataset.inci == 'true' ? 0.8 : 0.2],
                    duration: 2000,
                    easing: 'linear',
                });
                dist_faded = true;
                
                this.animation_controller.add({
                    targets: this.selected_elements.filter(e => !e.matches(`#pop-${ci_id}-arrow, #arrow_main_line, #arrow_arm_1, #arrow_arm_2, #pop-${ci_id}-text, #tail-${ci_id}-text`)),
                    'stroke-opacity': [0, 1],
                    'fill-opacity': [0, 1],
                    duration: 1000,
                    easing: 'linear',
                });
                this.animation_controller.add({
                    targets: this.selected_elements.filter(e => e.matches('line')),
                    'stroke': (el) => [anime.get(el, 'stroke'), d3.color('red').toString()],
                    duration: 1000,
                    easing: 'linear',
                });
                if(this.selected_elements.includes(this.ci_top_bar)){
                    this.animation_controller.add({
                        targets: this.selected_elements.filter(e => !e.matches(`#pop-${ci_id}-arrow, #arrow_main_line, #arrow_arm_1, #arrow_arm_2, #pop-${ci_id}-text, #tail-${ci_id}-text`)).filter(e => e.matches('line')),
                        'y1': (el) => [anime.get(this.ci_main_bar, 'y1'), anime.get(el, 'y1')],
                        'y2': (el) => [anime.get(this.ci_main_bar, 'y2'), anime.get(el, 'y2')],
                        duration: 1000,
                    });    
                }
            }
            let pop_arrow = this.selected_elements.filter(e => e.matches(`#pop-${ci_id}-arrow, #arrow_main_line, #arrow_arm_1, #arrow_arm_2, #pop-${ci_id}-text, #tail-${ci_id}-text`));
            if(pop_arrow.length > 0){

                // We want to start the animation from the population analysis arrow.
                // This is the last arrow drawn in its container.
                let population_match = document.querySelectorAll('#population_analysis #arrow_main_line');
                population_match = population_match[population_match.length - 1];
                let arrow_main = pop_arrow.filter(e=>e.matches('#arrow_main_line'))[0];

                // Calculate deltas to overlay arrows
                let y_delta = parseFloat(population_match.getAttribute('y2')) - parseFloat(arrow_main.getAttribute('y2'));
                let x_delta = parseFloat(population_match.getAttribute('x2')) - parseFloat(arrow_main.getAttribute('x2'));
                this.animation_controller.add({
                    targets: pop_arrow.filter(e => e.matches(`#arrow_main_line, #arrow_arm_1, #arrow_arm_2`)),
                    'stroke-opacity': [0, 1],
                    duration: 1000,
                    easing: 'easeInOutQuad'
                });
                this.animation_controller.add({
                    targets: pop_arrow.filter(e => e.matches(`#arrow_main_line, #arrow_arm_1, #arrow_arm_2`)),
                    'y1': (el) => [parseFloat(anime.get(el, 'y1')) + y_delta,  anime.get(el, 'y1')],
                    'y2': (el) => [parseFloat(anime.get(el, 'y2')) + y_delta,  anime.get(el, 'y2')],
                    'x1': (el) => [parseFloat(anime.get(el, 'x1')) + x_delta,  anime.get(el, 'x1')],
                    'x2': (el) => [parseFloat(anime.get(el, 'x2')) + x_delta, (el) => anime.get(el, 'x2')],
                    duration: 2000,
                    easing: 'easeInQuint'
                });
                this.animation_controller.add({
                    targets: pop_arrow.filter(e => e.matches(`#pop-${ci_id}-arrow, #pop-${ci_id}-text, #tail-${ci_id}-text`)),
                    'stroke-opacity': [0, 1],
                    'fill-opacity': [0, 1],
                    'y2': (el) => [anime.get(el, 'y1'),  anime.get(el, 'y2')],
                    'stroke': (el) => [anime.get(el, 'stroke'), el.matches('line') ? d3.color('red').toString(): anime.get(el, 'stroke')],
                    duration: 750,
                    easing: 'easeOutElastic(1, 0.3)',
                }, '-=10');
                if(!dist_faded){
                    this.animation_controller.add({
                        targets: this.dist_datapoints,
                        'stroke-opacity': (el) => [anime.get(el, 'stroke-opacity'), el.dataset.inci == 'true' ? 0.8 : 0.2],
                        'fill-opacity': (el) => [anime.get(el, 'fill-opacity'), el.dataset.inci == 'true' ? 0.8 : 0.2],
                        duration: 1000,
                        easing: 'linear',
                    }, '-=500');
                }
            }
            this.total_duration = this.animation_controller.duration;
        },
        percentUpdate: function(p){
            this.animation_controller.seek(p * this.animation_controller.duration);
            return p >= 1;
        },
        remove: function(){
            this.animation_controller.seek(0);
            let ci = document.querySelectorAll(ci_selector);
            for(let e of ci){
                e.setAttribute('y1', e.getAttribute('data-y1'));
                e.setAttribute('y2', e.getAttribute('data-y2'));
                e.setAttribute('x1', e.getAttribute('data-x1'));
                e.setAttribute('x2', e.getAttribute('data-x2'));
            }
        }
    }
    return animation;
}

function ma_createAnimation(animation, pop_dimensions, sample_dimensions, static_elements, dynamic_elements, module, speed, sample_index, include_distribution, animate_points){
    let stage = null;
    let sample_length = vis.samples[sample_index].all.length;
    let sample_permute = new Array(sample_length).fill(0).map((e, i) => i);
    d3.shuffle(sample_permute);
    let skip = speed > 10;
    if(module.name == "Bootstrapping"){
        if(pop_dimensions[0].type == 'numeric'){
            if(!skip){
                bootstrap_fade_in(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, 5000/speed, animate_points, sample_permute);
                if(animate_points){
                    bootstrap_animate_points(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, 10000/speed, animate_points, sample_permute);
                }
                delayStage(animation, 1000/speed);
                stage = new animStage('fade', animation.name, include_distribution ? 100/speed : 100/speed);
                point_skip_drop(static_elements, dynamic_elements, stage, sample_index);
                animation.addStage(stage);
            }else{
                stage = new animStage('fade', animation.name, include_distribution ? 1000/speed : 2000/speed);
                stage.setFunc(()=>{
                    if(!dd_showing) dd_toggle();
                    dd_clearDatapoints({all: vis.samples[sample_index].all}, pop_dimensions, sample_dimensions);
                    dd_updateDatapoints({all: vis.samples[sample_index].all}, pop_dimensions, sample_dimensions, false)
                });
                point_skip_drop(static_elements, dynamic_elements, stage, sample_index);
                animation.addStage(stage);
            }
        }else{
            prop_bootstrap_fade_in(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, 5000/speed, animate_points, sample_permute);
            if(animate_points){
                prop_bootstrap_animate_points(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, 10000/speed, animate_points, sample_permute);
            }
            stage = new animStage('fadeBar', animation.name, include_distribution ? 1000/speed : 5000/speed);
            prop_fade_stage(static_elements, dynamic_elements, stage, sample_index);
            animation.addStage(stage);
        }
        delayStage(animation, 1000/speed);
        if(include_distribution){
            delayStage(animation, 1000/speed);
    
            stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);
            if(sample_dimensions.length > 1){
                if(sample_dimensions[1].type == 'numeric'){
                    dist_drop_slope_stage(static_elements, dynamic_elements, stage, sample_index);
                }else{
                    if(sample_dimensions[1].factors.length == 2){
                        dist_drop_diff_stage(static_elements, dynamic_elements, stage, sample_index);
                    }else if(sample_dimensions[1].factors.length > 2){
                        dist_drop_devi_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                    }
                }
            }else if(sample_dimensions.length < 2){
                dist_drop_point_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
            }
            
            animation.addStage(stage);
    
            if(sample_dimensions.length > 1 && sample_dimensions[1].factors.length > 2){
                stage = new animStage('devi2', animation.name, 5000/speed);
                dist_drop_devi_stage_2(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                animation.addStage(stage);
            }
        }
        delayStage(animation, 1000/speed);
    }else if(module.name == "Randomisation Variation" || module.name == "Randomisation Test"){
        if(pop_dimensions[0].type == 'numeric'){
            if(!skip){
                if(speed < 2){
                    stage = new animStage('fade', animation.name, include_distribution ? 500/speed : 2500/speed);
                    randomisation_point_fade(static_elements, dynamic_elements, stage, sample_index);
                    animation.addStage(stage);
                    delayStage(animation, 1000/speed);
                    stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);
                    point_center_drop_stage(static_elements, dynamic_elements, stage);
                    animation.addStage(stage);
                }else{
                    stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);
                    point_center_skip_drop_stage(static_elements, dynamic_elements, stage, sample_index);
                    animation.addStage(stage);
                }


                stage = new animStage('drop2', animation.name, include_distribution ? 1000/speed : 5000/speed);
                point_center_split_stage(static_elements, dynamic_elements, stage);

                
                animation.addStage(stage);
            }else{
                stage = new animStage('skip_drop', animation.name, include_distribution ? 1000/speed : 2000/speed);
                point_skip_drop(static_elements, dynamic_elements, stage, sample_index);
                animation.addStage(stage);
            }
        }else{
            stage = new animStage('fadePoint', animation.name, include_distribution ? 1000/speed : 5000/speed);
            let selected_elements = prop_point_fade_stage(static_elements, dynamic_elements, stage, sample_index);
            animation.addStage(stage);
            stage = new animStage('pointDrop', animation.name, include_distribution ? 1000/speed : 5000/speed);
            prop_point_drop_stage(static_elements, dynamic_elements, stage, sample_index, selected_elements);
            animation.addStage(stage);
            stage = new animStage('fadeBar', animation.name, include_distribution ? 1000/speed : 5000/speed);
            prop_fade_stage(static_elements, dynamic_elements, stage, sample_index);
            animation.addStage(stage);
        }
        delayStage(animation, 1000/speed);
        if(include_distribution){
            delayStage(animation, 1000/speed);
    
            stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);
            if(sample_dimensions.length > 1){
                if(sample_dimensions[1].type == 'numeric'){
                    dist_drop_slope_stage(static_elements, dynamic_elements, stage, sample_index);
                }else{
                    if(sample_dimensions[1].factors.length == 2){
                        dist_drop_diff_stage(static_elements, dynamic_elements, stage, sample_index);
                    }else if(sample_dimensions[1].factors.length > 2){
                        dist_drop_devi_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                    }
                }
            }else if(sample_dimensions.length < 2){
                dist_drop_point_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
            }
            
            animation.addStage(stage);
    
            if(sample_dimensions.length > 1 && sample_dimensions[1].factors.length > 2){
                stage = new animStage('devi2', animation.name, 5000/speed);
                dist_drop_devi_stage_2(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                animation.addStage(stage);
            }
        }
        delayStage(animation, 1000/speed);
    }else if(module.name == "Confidence Interval"){
        if(pop_dimensions[0].type == 'numeric'){
            if(!skip){
                stage = new animStage('fade', animation.name, include_distribution ? 1000/speed : 5000/speed);
                point_fade_stage(static_elements, dynamic_elements, stage, sample_index, false);
                animation.addStage(stage);
                delayStage(animation, 1000/speed);
                stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);

                point_drop_stage(static_elements, dynamic_elements, stage, sample_index);
                point_drop_cirange_stage(static_elements, dynamic_elements, stage, sample_index);
                
                
                animation.addStage(stage);
            }else{
                stage = new animStage('fade', animation.name, include_distribution ? 1000/speed : 2000/speed);
                point_skip_drop_ci_range(static_elements, dynamic_elements, stage, sample_index);
                point_skip_drop(static_elements, dynamic_elements, stage, sample_index, false);
                animation.addStage(stage);
            }
        }else{
            stage = new animStage('fadePoint', animation.name, include_distribution ? 1000/speed : 5000/speed);
            let selected_elements = prop_point_fade_stage(static_elements, dynamic_elements, stage, sample_index);
            animation.addStage(stage);
            stage = new animStage('pointDrop', animation.name, include_distribution ? 1000/speed : 5000/speed);
            prop_point_drop_stage(static_elements, dynamic_elements, stage, sample_index, selected_elements, false);
            prop_point_drop_cirange_stage(static_elements, dynamic_elements, stage, sample_index, selected_elements);
            animation.addStage(stage);
            stage = new animStage('fadeBar', animation.name, include_distribution ? 1000/speed : 5000/speed);
            prop_fade_stage(static_elements, dynamic_elements, stage, sample_index);
            animation.addStage(stage);
        }
        delayStage(animation, 1000/speed);
        if(include_distribution){
            delayStage(animation, 1000/speed);
    
            stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);
            if(sample_dimensions.length > 1){
                if(sample_dimensions[1].type == 'numeric'){
                    dist_drop_slope_stage(static_elements, dynamic_elements, stage, sample_index);
                }else{
                    if(sample_dimensions[1].factors.length == 2){
                        dist_drop_diff_stage(static_elements, dynamic_elements, stage, sample_index);
                    }else if(sample_dimensions[1].factors.length > 2){
                        dist_drop_devi_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                    }
                }
            }else if(sample_dimensions.length < 2){
                dist_drop_point_cirange_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
            }
            
            animation.addStage(stage);
    
            if(sample_dimensions.length > 1 && sample_dimensions[1].factors.length > 2){
                stage = new animStage('devi2', animation.name, 5000/speed);
                dist_drop_devi_stage_2(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                animation.addStage(stage);
            }
        }
        delayStage(animation, 1000/speed);
    }else{
        if(pop_dimensions[0].type == 'numeric'){
            if(!skip){
                stage = new animStage('fade', animation.name, include_distribution ? 1000/speed : 5000/speed);
                point_fade_stage(static_elements, dynamic_elements, stage, sample_index);
                animation.addStage(stage);
                delayStage(animation, 1000/speed);
                stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);

                point_drop_stage(static_elements, dynamic_elements, stage);
                
                
                animation.addStage(stage);
            }else{
                stage = new animStage('fade', animation.name, include_distribution ? 1000/speed : 2000/speed);
                point_skip_drop(static_elements, dynamic_elements, stage, sample_index);
                animation.addStage(stage);
            }
        }else{
            stage = new animStage('fadePoint', animation.name, include_distribution ? 1000/speed : 5000/speed);
            let selected_elements = prop_point_fade_stage(static_elements, dynamic_elements, stage, sample_index);
            animation.addStage(stage);
            stage = new animStage('pointDrop', animation.name, include_distribution ? 1000/speed : 5000/speed);
            prop_point_drop_stage(static_elements, dynamic_elements, stage, sample_index, selected_elements);
            animation.addStage(stage);
            stage = new animStage('fadeBar', animation.name, include_distribution ? 1000/speed : 5000/speed);
            prop_fade_stage(static_elements, dynamic_elements, stage, sample_index);
            animation.addStage(stage);
        }
        delayStage(animation, 1000/speed);
        if(include_distribution){
            delayStage(animation, 1000/speed);
    
            stage = new animStage('drop', animation.name, include_distribution ? 1000/speed : 5000/speed);
            if(sample_dimensions.length > 1){
                if(sample_dimensions[1].type == 'numeric'){
                    dist_drop_slope_stage(static_elements, dynamic_elements, stage, sample_index);
                }else{
                    if(sample_dimensions[1].factors.length == 2){
                        dist_drop_diff_stage(static_elements, dynamic_elements, stage, sample_index);
                    }else if(sample_dimensions[1].factors.length > 2){
                        dist_drop_devi_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                    }
                }
            }else if(sample_dimensions.length < 2){
                dist_drop_point_stage(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
            }
            
            animation.addStage(stage);
    
            if(sample_dimensions.length > 1 && sample_dimensions[1].factors.length > 2){
                stage = new animStage('devi2', animation.name, 5000/speed);
                dist_drop_devi_stage_2(static_elements, dynamic_elements, stage, sample_index, sample_dimensions[0].type == 'numeric');
                animation.addStage(stage);
            }
        }
        delayStage(animation, 1000/speed);
    }


    
}

function delayStage(animation, delay){
    let stage = new animStage('delay', animation.name, delay);
    animation.addStage(stage);
}
function bootstrap_fade_in(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, time, animate_points, sample_permute){
    let sample = vis.samples[sample_index];
    let sample_length = sample.all.length;
    let stage_duration = time / sample_length;
    let stage = new animStage('b_fade', animation.name, stage_duration);
    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index);
    


    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
    }
    animation.addStage(stage);
    let faded_in = [];
    for(let i = 0; i < sample_length; i++){
        stage = new animStage('b_fade' + i, animation.name, stage_duration);
        stage.setFunc(()=>{
            if(!dd_showing) dd_toggle();
            dd_clearDatapoints({all: d3.permute(sample.all, sample_permute)}, pop_dimensions, sample_dimensions);
            dd_updateSingleDatapoints({all: vis.dataset.all, permuted: d3.permute(sample.all, sample_permute)}, pop_dimensions, sample_dimensions, sample_permute[i], i, false);
        });
        for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
            let stat_marker = dynamic_elements.stat_markers[i];
            stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
        }
        let element = dynamic_elements.datapoints.all[sample_permute[i]];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        //pop_elements.push(pop_element);
        for(let n = 0; n < sample_length; n++){
            if(n == i) continue;
            let element = dynamic_elements.datapoints.all[sample_permute[n]];
            let element_id = element.getAttr('id');
            let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
            let fill = faded_in.includes(pop_element) ? 1 : 0;
            stage.setTransition(pop_element, 'fill-opacity', fill, fill, 0, 0);
            if(n >= i){
                stage.setTransition(element, 'fill-opacity', 0, 0, 0, 1);
                
                continue;
            }
            //pop_elements.push(pop_element);
            //stage.setTransition(element, 'y', pop_element.getAttr('init_y'), pop_element.getAttr('init_y'), 0, 1);
            stage.setTransition(element, 'y', animate_points ? element.getAttr('init_y') : pop_element.getAttr('init_y'), animate_points ? element.getAttr('init_y') : pop_element.getAttr('init_y'), 0, 1);
            stage.setTransition(element, 'fill-opacity', 1, 1, 0, 1);
            stage.setTransition(element, 'stroke-opacity', 1, 1, 0, 1);
            stage.setTransition(element, 'selected', n == i - 1 ? 1 : 0, 0, 0, 1);
        }
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), animate_points ? element.getAttr('init_y') : pop_element.getAttr('init_y'), 0, 1);
        stage.setTransition(element, 'fill-opacity', 0, 1, 0, 1);
        stage.setTransition(element, 'stroke-opacity', 0, 1, 0, 1);
        stage.setTransition(element, 'selected', 0, 1, 0, 1);
        if(!faded_in.includes(pop_element)){
            stage.setTransition(pop_element, 'fill-opacity', 0, 1, 0, 1);
            faded_in.push(pop_element);
        }
        animation.addStage(stage);
        delayStage(animation, stage_duration);
    }

}
function bootstrap_animate_points(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, time, animate_points, sample_permute){
    let sample = vis.samples[sample_index];
    let sample_length = sample.all.length;
    let stage_duration = time / sample_length;
    let stage = new animStage('b_ani', animation.name, stage_duration);
    let faded_in = [];
    for(let i = 0; i < vis.dataset.all.length; i++){
        stage = new animStage('b_ani' + i, animation.name, stage_duration);
        stage.setFunc(()=>{
            if(!dd_showing) dd_toggle();
            dd_clearDatapoints({all: d3.permute(sample.all, sample_permute)}, pop_dimensions, sample_dimensions);
            dd_linkSingleDatapoint({all: vis.dataset.all, permuted: d3.permute(sample.all, sample_permute)}, pop_dimensions, sample_dimensions, sample_permute[i], i, false);
        });
        for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
            let stat_marker = dynamic_elements.stat_markers[i];
            stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
        }
        let pop_element_data = vis.dataset.all[i];
        
        let element_id = pop_element_data.id;
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        let sample_elements = dynamic_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id);
        for(let n = 0; n < sample_length; n++){
            let element = dynamic_elements.datapoints.all[sample_permute[n]];


            let fill = sample_elements.includes(element) ? 1 : 0;
            stage.setTransition(element, 'fill-opacity', 0, fill, 0, 0.3);
            stage.setTransition(element, 'selected', 0, fill, 0, 0.3);
        }
        for(let n = 0; n < static_elements.datapoints.all.length; n++){
            let pe = static_elements.datapoints.all[n];
            let fill = pe.getAttr('id') == element_id ? 1 : 0;
            stage.setTransition(pe, 'fill-opacity', 0, fill, 0, 0.3);
            stage.setTransition(pe, 'selected', 0, fill, 0, 0.3);
        }
        animation.addStage(stage);
        delayStage(animation, stage_duration);
    }

}
function prop_bootstrap_fade_in(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, time, animate_points, sample_permute){
    let sample = vis.samples[sample_index];
    let sample_length = sample.all.length;
    let stage_duration = time / sample_length;
    let stage = new animStage('b_fade', animation.name, stage_duration);
    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index);
    


    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
    }
    animation.addStage(stage);

    let faded_in = [];
    let sorted_datapoints = dynamic_elements.datapoints.all.filter((e)=> e.type == 'datapoint').sort((a,b) => (a['factorX'] > b['factorX']) ? 1 : ((b['factorX'] > a['factorX']) ? -1 : 0));
    let sorted_sample = [...sample.all].map((e) => {e['sort_col'] = e[sample_dimensions[0].name] == sample_dimensions[0].focus ? sample_dimensions[0].focus : 'other'; return e});
    sorted_sample.sort((a,b) => (a['sort_col']  > b['sort_col']) ? 1 : ((b['sort_col'] > a['sort_col']) ? -1 : 0));
    let sample_datapoints = d3.permute(sorted_datapoints, sample_permute);
    let sample_permuted = d3.permute(sorted_sample, sample_permute);
    for(let i = 0; i < sample_length; i++){
        stage = new animStage('b_fade' + i, animation.name, stage_duration);

        for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
            let stat_marker = dynamic_elements.stat_markers[i];
            stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
        }
        let element = sample_datapoints[i];
        let element_id = element.getAttr('id');
        let matching_elements = static_elements.datapoints.all.filter((e)=>e.type=="datapoint" && e.getAttr('factorX')== element.getAttr('factorX') && e.getAttr('factorY')== element.getAttr('factorY'));
        let pop_element = matching_elements[Math.floor(Math.random() * matching_elements.length)];
        //pop_elements.push(pop_element);
        
        for(let n = 0; n < sample_length; n++){
            if(n == i) continue;
            let element = sample_datapoints[i];
            let element_id = element.getAttr('id');
            let matching_elements = static_elements.datapoints.all.filter((e)=>e.type=="datapoint" && e.getAttr('factorX')== element.getAttr('factorX') && e.getAttr('factorY')== element.getAttr('factorY'));
            let pop_element = matching_elements[Math.floor(Math.random() * matching_elements.length)];
            let fill = faded_in.includes(pop_element) ? 1 : 0;
            stage.setTransition(pop_element, 'fill-opacity', fill*0.5, fill*0.5, 0, 0);
            if(n >= i){
                stage.setTransition(element, 'fill-opacity', 0, 0, 0, 1);
                
                continue;
            }
            //pop_elements.push(pop_element);
            //stage.setTransition(element, 'y', pop_element.getAttr('init_y'), pop_element.getAttr('init_y'), 0, 1);
            stage.setTransition(element, 'y', element.getAttr('init_y'), element.getAttr('init_y'), 0, 1);
            stage.setTransition(element, 'fill-opacity', 0.5, 0.5, 0, 1);
            stage.setTransition(element, 'stroke-opacity', 0.5, 0.5, 0, 1);
            stage.setTransition(element, 'selected', n == i - 1 ? 1 : 0, 0, 0, 1);
        }
        stage.setTransition(element, 'y', !animate_points ? element.getAttr('init_y') : pop_element.getAttr('init_y'), element.getAttr('init_y'), 0, 1);
        stage.setTransition(element, 'x', !animate_points ? element.getAttr('init_x') : pop_element.getAttr('init_x'), element.getAttr('init_x'), 0, 1);
        stage.setTransition(element, 'fill-opacity', 0, 0.5, 0, 1);
        stage.setTransition(element, 'stroke-opacity', 0, 0.5, 0, 1);
        stage.setTransition(element, 'selected', 0, 1, 0, 1);
        if(!faded_in.includes(pop_element)){
            stage.setTransition(pop_element, 'fill-opacity', 0, 0.5, 0, 1);
            faded_in.push(pop_element);
        }
        stage.setFunc(()=>{
            if(!dd_showing) dd_toggle();
            dd_clearDatapoints({all: sample_permuted}, pop_dimensions, sample_dimensions);
            dd_updateSingleDatapoints({all: vis.dataset.all, permuted: sample_permuted}, pop_dimensions, sample_dimensions, sample_permute[i], i, false);
            let pop_elements = static_elements.datapoints.all.filter((e)=>e.type=="datapoint");
            for(let e = 0; e < pop_elements.length; e++){
                let pop_element = pop_elements[e];
                // pop_element.setAttr('fill-opacity', faded_in.includes(pop_element));
                //pop_element.setAttr('fill-opacity', 0);
            
            }
        });
        animation.addStage(stage);
        delayStage(animation, stage_duration);
    }

}
function prop_bootstrap_animate_points(animation, pop_dimensions, sample_dimensions, sample_index, dynamic_elements, static_elements, time, animate_points, sample_permute){
    let sample = vis.samples[sample_index];
    let sample_length = sample.all.length;
    let stage_duration = time / sample_length;
    let stage = new animStage('b_ani', animation.name, stage_duration);
    let faded_in = [];
    let sorted_datapoints = dynamic_elements.datapoints.all.filter((e)=> e.type == 'datapoint').sort((a,b) => (a['factorX'] > b['factorX']) ? 1 : ((b['factorX'] > a['factorX']) ? -1 : 0));
    let sorted_sample = [...sample.all].map((e) => {e['sort_col'] = e[sample_dimensions[0].name] == sample_dimensions[0].focus ? sample_dimensions[0].focus : 'other'; return e});
    sorted_sample.sort((a,b) => (a['sort_col']  > b['sort_col']) ? 1 : ((b['sort_col'] > a['sort_col']) ? -1 : 0));
    let sample_datapoints = d3.permute(sorted_datapoints, sample_permute);
    let sample_permuted = d3.permute(sorted_sample, sample_permute);
    for(let i = 0; i < vis.dataset.all.length; i++){
        stage = new animStage('b_ani' + i, animation.name, stage_duration);
        stage.setFunc(()=>{
            if(!dd_showing) dd_toggle();
            dd_clearDatapoints({all: sample_permuted}, pop_dimensions, sample_dimensions);
            dd_linkSingleDatapoint({all: vis.dataset.all, permuted: sample_permuted}, pop_dimensions, sample_dimensions, sample_permute[i], i, false);
        });
        for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
            let stat_marker = dynamic_elements.stat_markers[i];
            stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
        }
        // let pop_element_data = vis.dataset.all[i];
        // let element_id = pop_element_data.id;
        // let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        // let sample_elements = dynamic_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id);
        // for(let n = 0; n < sample_length; n++){
        //     let element = dynamic_elements.datapoints.all[sample_permute[n]];


        //     let fill = sample_elements.includes(element) ? 1 : 0;
        //     stage.setTransition(element, 'fill-opacity', 0, fill, 0, 0.3);
        //     stage.setTransition(element, 'selected', 0, fill, 0, 0.3);
        // }
        // for(let n = 0; n < static_elements.datapoints.all.length; n++){
        //     let pe = static_elements.datapoints.all[n];
        //     let fill = pe.getAttr('id') == element_id ? 1 : 0;
        //     stage.setTransition(pe, 'fill-opacity', 0, fill, 0, 0.3);
        //     stage.setTransition(pe, 'selected', 0, fill, 0, 0.3);
        // }
        animation.addStage(stage);
        delayStage(animation, stage_duration);
    }

}

function point_fade_stage(static_elements, dynamic_elements, stage, sample_index, stat_mark = true){
    let pop_elements = [];
    let delay = 1/dynamic_elements.datapoints.all.length;
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        pop_elements.push(pop_element);
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), pop_element.getAttr('init_y'), 0, 1);
        stage.setTransition(element, 'fill-opacity', 0, 1, delay*i, delay*(i+1));
        stage.setTransition(element, 'stroke-opacity', 0, 1, delay*i, delay*(i+1));
        stage.setTransition(element, 'selected', 0, 1, delay*i, delay*(i+1));
    }
    for(let i = 0; i < static_elements.datapoints.all.length; i++){
        let element = static_elements.datapoints.all[i];
        let fill = pop_elements.includes(element) ? 1 : 0;
        stage.setTransition(element, 'fill-opacity', 0, fill, fill, fill);
    }
    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index, stat_mark);
    
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
    }

    let dimensions = model.getSampleDimensions();

    if(dimensions.length > 1 && dimensions[1].type == 'numeric'){
        let distribution_slopes = dynamic_elements.all.filter((e)=>e.id == "dist_stat_lineline");
        for(let i = 0; i < distribution_slopes.length; i++){
            stage.setTransition(distribution_slopes[i], 'stroke-opacity', 0, i == distribution_slopes.length -1 ? 0.2 : 0.2, 0, 0);
        }
    }
}
function randomisation_point_fade(static_elements, dynamic_elements, stage, sample_index){
    let pop_elements = [];
    let delay = 1/dynamic_elements.datapoints.all.length;
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        pop_elements.push(pop_element);
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), pop_element.getAttr('init_y'), 0, 1);
        stage.setTransition(element, 'fill-opacity', 0, 1, 0, 1);
        stage.setTransition(element, 'stroke-opacity', 0, 1, 0, 1);
        stage.setTransition(element, 'selected', 0, 1, 0, 1);
        stage.setTransition(element, "fill-color", element.getAttr("init_fill-color"), pop_element.getAttr("init_fill-color"), 0, 0.2);
        stage.setTransition(element, "stroke-color", element.getAttr("init_stroke-color"), pop_element.getAttr("init_stroke-color"), 0, 0.2);
    }
    for(let i = 0; i < static_elements.datapoints.all.length; i++){
        let element = static_elements.datapoints.all[i];
        let fill = pop_elements.includes(element) ? 1 : 0;
        stage.setTransition(element, 'fill-opacity', 0, fill, fill, fill);
    }
    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index);
    
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
    }

    let dimensions = model.getSampleDimensions();

    if(dimensions.length > 1 && dimensions[1].type == 'numeric'){
        let distribution_slopes = dynamic_elements.all.filter((e)=>e.id == "dist_stat_lineline");
        for(let i = 0; i < distribution_slopes.length; i++){
            stage.setTransition(distribution_slopes[i], 'stroke-opacity', 0, i == distribution_slopes.length -1 ? 0 : 0.2, 0, 0);
        }
    }
}
function prop_point_fade_stage(static_elements, dynamic_elements, stage, sample_index){
    let pop_elements = [];
    let delay = 1/dynamic_elements.datapoints.all.length;
    let factor_names = [];
    let factor_items = {};
    for(let pop_circle_id = 0; pop_circle_id < static_elements.datapoints.all.length; pop_circle_id++){

        let pop_circle = static_elements.datapoints.all[pop_circle_id];
        if(pop_circle.type != 'datapoint') continue;
        let factor_name = pop_circle.attrs.text;
        if(!(factor_name in factor_items)){
            factor_names.push(factor_name);
            factor_items[factor_name] = [];
        }
        factor_items[factor_name].push(pop_circle);
    }
    let sample_factor_names = [];
    let sample_factor_items = {};
    for(let samp_circle_id = 0; samp_circle_id < dynamic_elements.datapoints.all.length; samp_circle_id++){

        let samp_circle = dynamic_elements.datapoints.all[samp_circle_id];
        if(samp_circle.type != 'datapoint') continue;
        let sample_factor_name = samp_circle.attrs.text;
        if(!(sample_factor_name in sample_factor_items)){
            sample_factor_names.push(sample_factor_name);
            sample_factor_items[sample_factor_name] = [];
        }
        sample_factor_items[sample_factor_name].push(samp_circle);
    }
    let selected_pop_elems = [];
    for(let n = 0; n < sample_factor_names.length; n++){
        let fac_name = sample_factor_names[n];
        d3.shuffle(factor_items[fac_name]);
        selected_pop_elems.push(factor_items[fac_name].slice(0, sample_factor_items[fac_name].length));
    }
    let selected_flat = selected_pop_elems.flat();
    // for(let i = 0; i < selected_flat.length; i++){
    //     let element = selected_flat[i];
    //     let element_id = element.getAttr('id');
    //     let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
    //     pop_elements.push(pop_element);
    //     stage.setTransition(element, 'y', pop_element.getAttr('init_y'), pop_element.getAttr('init_y'), 0, 1);
    //     stage.setTransition(element, 'fill-opacity', 0, 1, delay*i, delay*(i+1));
    //     stage.setTransition(element, 'stroke-opacity', 0, 1, delay*i, delay*(i+1));
    //     stage.setTransition(element, 'selected', 0, 1, delay*i, delay*(i+1));
    // }
    let elem_counter = 0;
    let dyn_elems = dynamic_elements.datapoints.all.filter((e) => e.type == 'datapoint');
    let sample_factor_count = {};
    for(let i = 0; i < static_elements.datapoints.all.length; i++){
        let element = static_elements.datapoints.all[i];
        if(element.type != 'datapoint') continue;
        let fill = selected_flat.includes(element) ? 1 : 0;
        stage.setTransition(element, 'fill-opacity', 0, fill*0.5, delay*elem_counter, delay*(elem_counter+1));
        stage.setTransition(element, 'stroke-opacity', 0, fill*0.5, delay*elem_counter, delay*(elem_counter+1));
        let pop_factorX = element.getAttr('factorX');

        if (!fill || elem_counter >= dyn_elems.length) continue;
        if(!(pop_factorX in sample_factor_count)){
            sample_factor_count[pop_factorX] = 0;
        }
        let dyn_element = sample_factor_items[pop_factorX][sample_factor_count[pop_factorX] ];
        stage.setTransition(dyn_element, 'y', element.getAttr('init_y'), element.getAttr('init_y'), delay*elem_counter, delay*(elem_counter+1));
        stage.setTransition(dyn_element, 'parent-y', element.getAttr('init_y'), element.getAttr('init_y'), delay*elem_counter, delay*(elem_counter+1));
        stage.setTransition(dyn_element, 'x', element.getAttr('init_x'), element.getAttr('init_x'), delay*elem_counter, delay*(elem_counter+1));
        stage.setTransition(dyn_element, 'parent-x', element.getAttr('init_x'), element.getAttr('init_x'), delay*elem_counter, delay*(elem_counter+1));
        stage.setTransition(dyn_element, 'fill-opacity', 0, 0.5, delay*elem_counter, delay*(elem_counter+1));
        sample_factor_count[pop_factorX]++;
        elem_counter += fill;
        // stage.setTransition(element, 'x', 0, 100 * fill, 0, fill);
        // stage.setTransition(element, 'y', 0, 100 * fill, 0, fill);

    }
    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index);
    
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
        stage.setTransition(stat_marker, 'fill-opacity', 0, 1, 0, 1);
    }
    return selected_flat;

}

function point_skip_drop(static_elements, dynamic_elements, stage, sample_index, stat_mark = true){
    let pop_elements = [];
    let delay = 1/dynamic_elements.datapoints.all.length;
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        pop_elements.push(pop_element);
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), pop_element.getAttr('init_y'), 0, 1);
        stage.setTransition(element, 'fill-opacity', 1, 1, 0, 0);
        stage.setTransition(element, 'stroke-opacity', 1, 1, 0, 0);
        stage.setTransition(element, 'selected', 1, 1, 0, 0);
    }
    for(let i = 0; i < static_elements.datapoints.all.length; i++){
        let element = static_elements.datapoints.all[i];
        let fill = pop_elements.includes(element) ? 1 : 0;
        stage.setTransition(element, 'fill-opacity', fill, fill, 0, 1);
    }
    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index, stat_mark);
    
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 0);
    }

    let dimensions = model.getSampleDimensions();

    if(dimensions.length > 1 && dimensions[1].type == 'numeric'){
        let distribution_slopes = dynamic_elements.all.filter((e)=>e.id == "dist_stat_lineline");
        for(let i = 0; i < distribution_slopes.length; i++){
            stage.setTransition(distribution_slopes[i], 'stroke-opacity', 0, i == distribution_slopes.length -1 ? 0 : 0.2, 0, 0);
        }
    }

    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        stage.setTransition(element, 'y', element.getAttr('init_y'), element.getAttr('init_y'), 0, 1);
    }
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 1, 1, 0, 0);
    }
}
function point_skip_drop_ci_range(static_elements, dynamic_elements, stage, sample_index){
    let range_bar = dynamic_elements.distribution.stats[sample_index].filter((e) => e.id.includes("dist_stat_range"))[0];
    let range_bar_stay = dynamic_elements.distribution.stats[sample_index].filter((e) => e.id.includes("dist_stat_stay"))[0];
    stage.setTransition(range_bar, "stroke-opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar, "opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar, "selected", 0, 1, 0, 0);
    stage.setTransition(range_bar, "lineWidth", 1, 3, 0, 0);
    stage.setTransition(range_bar_stay, "stroke-opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar_stay, "opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar_stay, "selected", 0, 1, 0, 0);
    stage.setTransition(range_bar_stay, "lineWidth", 1, 3, 0, 0);
    stage.setFunc(function(){
        if(!dynamic_elements.all.includes(range_bar)) dynamic_elements.all.push(range_bar);
        if(!dynamic_elements.all.includes(range_bar_stay)) dynamic_elements.all.push(range_bar_stay);
    });
}


function prop_fade_stage(static_elements, dynamic_elements, stage, sample_index, stat_mark = true){
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        let fill = element.type == 'datapoint' ? 0 : 1;
        stage.setTransition(element, 'fill-opacity', (!fill)*0.5, fill, 0, 1);
        stage.setTransition(element, 'stroke-opacity', !fill, fill, 0, 1);
    }
    element = dynamic_elements.stat_markers[0];
    stage.setTransition(element, 'fill-opacity', 0, 1, 0, 1);
    stage.setTransition(element, 'stroke-opacity', 0, 1, 0, 1);
    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index, stat_mark);
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 1, 0.5, 1);
    }
}

function stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index, show_stat_mark = true){
    for(let i = 0; i < dynamic_elements.ghosts.length; i++){
        let element = dynamic_elements.ghosts[i];
        
        let y1 = element.getAttr('init_y1');
        let y2 = element.getAttr('init_y2');
        let x1 = element.getAttr('init_x1');
        let x2 = element.getAttr('init_x2');
        if(element.id.includes("range") || !show_stat_mark){
            stage.setTransition(element, 'fill-opacity', 0, 0, 0, 1);
            stage.setTransition(element, 'stroke-opacity', 0, 0, 0, 1);
        }else{
            stage.setTransition(element, 'fill-opacity', 0.2, 0.2, 0, 1);
            stage.setTransition(element, 'stroke-opacity', 0.2, 0.2, 0, 1);
        }

        stage.setTransition(element, 'selected', 0, 0, 0, 1);
        stage.setTransition(element, 'lineWidth', 1, 1, 0, 1);
        if(x1 != x2) continue;
        stage.setTransition(element, 'y2', y2 + (y1-y2)/1.5, y2 + (y1-y2)/1.5, 0, 1);
    }
    let dist_elem = dynamic_elements.distribution.datapoints[sample_index];
    stage.setTransition(dist_elem, 'stroke-opacity', 0, 0, 0, 1);
    stage.setTransition(dist_elem, 'fill-opacity', 0, 0, 0, 1);
}


function point_drop_stage(static_elements, dynamic_elements, stage, sample_index){
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), element.getAttr('init_y'), 0, 1);
    }
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 1, 0.8, 1);
    }

}
function point_drop_cirange_stage(static_elements, dynamic_elements, stage, sample_index){
    let range_bar = dynamic_elements.distribution.stats[sample_index].filter((e) => e.id.includes("dist_stat_range"))[0];
    let range_bar_stay = dynamic_elements.distribution.stats[sample_index].filter((e) => e.id.includes("dist_stat_stay"))[0];
    stage.setTransition(range_bar, "stroke-opacity", 0, 1, 0.8, 1);
    stage.setTransition(range_bar, "opacity", 0, 1, 0.8, 1);
    stage.setTransition(range_bar, "selected", 0, 1, 0.8, 0);
    stage.setTransition(range_bar, "lineWidth", 1, 3, 0.8, 0);
    stage.setTransition(range_bar_stay, "stroke-opacity", 0, 1, 0.8, 1);
    stage.setTransition(range_bar_stay, "opacity", 0, 1, 0.8, 1);
    stage.setTransition(range_bar_stay, "selected", 0, 1, 0, 0);
    stage.setTransition(range_bar_stay, "lineWidth", 1, 3, 0, 0);
    stage.setFunc(function(){
        if(!dynamic_elements.all.includes(range_bar)) dynamic_elements.all.push(range_bar);
        if(!dynamic_elements.all.includes(range_bar_stay)) dynamic_elements.all.push(range_bar_stay);
    });
}

function prop_point_drop_stage(static_elements, dynamic_elements, stage, sample_index, selected_elements){
    for(let i = 0; i < selected_elements.length; i++){
        let element = dynamic_elements.datapoints.all.filter((e) => e.type == 'datapoint')[i];
        let element_id = element.getAttr('id');
        let pop_element = selected_elements[i];
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), element.getAttr('init_y'), 0, 1);
        stage.setTransition(element, 'x', pop_element.getAttr('init_x'), element.getAttr('init_x'), 0, 1);
        stage.setTransition(element, 'r', pop_element.getAttr('r'), element.getAttr('r'), 0.5, 1);
    }
    // for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
    //     let stat_marker = dynamic_elements.stat_markers[i];
    //     stage.setTransition(stat_marker, 'stroke-opacity', 0, 1, 0.8, 1);
    // }

}
function prop_point_drop_cirange_stage(static_elements, dynamic_elements, stage, sample_index, selected_elements){
    let range_bar = dynamic_elements.distribution.stats[sample_index].filter((e) => e.id.includes("dist_stat_range"))[0];
    let range_bar_stay = dynamic_elements.distribution.stats[sample_index].filter((e) => e.id.includes("dist_stat_stay"))[0];
    stage.setTransition(range_bar, "stroke-opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar, "opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar, "selected", 0, 1, 0, 0);
    stage.setTransition(range_bar, "lineWidth", 1, 3, 0, 0);
    stage.setTransition(range_bar_stay, "stroke-opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar_stay, "opacity", 0, 1, 0, 1);
    stage.setTransition(range_bar_stay, "selected", 0, 1, 0, 0);
    stage.setTransition(range_bar_stay, "lineWidth", 1, 3, 0, 0);
    stage.setFunc(function(){
        if(!dynamic_elements.all.includes(range_bar)) dynamic_elements.all.push(range_bar);
        if(!dynamic_elements.all.includes(range_bar_stay)) dynamic_elements.all.push(range_bar_stay);
    });
}

function point_center_drop_stage(static_elements, dynamic_elements, stage){
    let middle_y = vis.areas['sec1display'].innerTop + vis.areas['sec1display'].innerHeight/2;
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), middle_y, 0, 0.75);
        stage.setTransition(element, 'fill-color', pop_element.getAttr("init_fill-color"), element.getAttr("init_fill-color"), 0.75, 1);
        stage.setTransition(element, 'stroke-color', pop_element.getAttr("init_stroke-color"), element.getAttr("init_stroke-color"), 0.75, 1);
    }

}
function point_center_skip_drop_stage(static_elements, dynamic_elements, stage, sample_index){
    let middle_y = vis.areas['sec1display'].innerTop + vis.areas['sec1display'].innerHeight/2;
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        stage.setTransition(element, 'y', pop_element.getAttr('init_y'), middle_y, 0, 0);
        stage.setTransition(element, 'fill-color', pop_element.getAttr("init_fill-color"), element.getAttr("init_fill-color"), 0.75, 1);
        stage.setTransition(element, 'stroke-color', pop_element.getAttr("init_stroke-color"), element.getAttr("init_stroke-color"), 0.75, 1);
        stage.setTransition(element, 'fill-opacity', 0, 1, 0, 1);
        stage.setTransition(element, 'stroke-opacity', 0, 1, 0, 1);
        stage.setTransition(element, 'selected', 0, 1, 0, 1);
    }

    stat_mark_fade_in(static_elements, dynamic_elements, stage, sample_index);
    
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 0, 0, 1);
    }

    let dimensions = model.getSampleDimensions();

    if(dimensions.length > 1 && dimensions[1].type == 'numeric'){
        let distribution_slopes = dynamic_elements.all.filter((e)=>e.id == "dist_stat_lineline");
        for(let i = 0; i < distribution_slopes.length; i++){
            stage.setTransition(distribution_slopes[i], 'stroke-opacity', 0, i == distribution_slopes.length -1 ? 0 : 0.2, 0, 0);
        }
    }

}
function point_center_split_stage(static_elements, dynamic_elements, stage){
    let middle_y = vis.areas['sec1display'].innerTop + vis.areas['sec1display'].innerHeight/2;
    for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
        let element = dynamic_elements.datapoints.all[i];
        let element_id = element.getAttr('id');
        let pop_element = static_elements.datapoints.all.filter((e)=>e.getAttr('id')== element_id)[0];
        stage.setTransition(element, 'y', middle_y, element.getAttr('init_y'), 0, 1);
    }
    for(let i = 0; i < dynamic_elements.stat_markers.length; i++){
        let stat_marker = dynamic_elements.stat_markers[i];
        stage.setTransition(stat_marker, 'stroke-opacity', 0, 1, 0.8, 1);
    }
}

function dist_drop_point_stage(static_elements, dynamic_elements, stage, sample_index, numeric){
    let stat_marker = dynamic_elements.stat_markers[dynamic_elements.stat_markers.length - 1];
    let dist_elem = dynamic_elements.distribution.datapoints[sample_index];
    stage.setTransition(stat_marker, 'y1', stat_marker.getAttr('init_y1'), dist_elem.getAttr('init_y'), 0, 1);
    stage.setTransition(stat_marker, 'y2', stat_marker.getAttr('init_y2'), dist_elem.getAttr('init_y'), 0, 1);
    stage.setTransition(stat_marker, 'lineWidth', 1, 3, 0, 0);
    stage.setTransition(stat_marker, 'selected', 0, 1, 0, 0);
    stage.setTransition(dist_elem, 'stroke-opacity', 0, 1, 0.8, 1);
    stage.setTransition(dist_elem, 'fill-opacity', 0, 1, 0.8, 1);

    if(numeric) {
        for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
            let element = dynamic_elements.datapoints.all[i];
            stage.setTransition(element, 'selected', 1, 0, 0, 0);
        }
    }
}
function dist_drop_point_cirange_stage(static_elements, dynamic_elements, stage, sample_index, numeric){
    let range_bar = dynamic_elements.distribution.stats[sample_index].filter((e) => e.id.includes("dist_stat_range"))[0];
    let dist_elem = dynamic_elements.distribution.datapoints[sample_index];
    stage.setTransition(range_bar, 'x1', range_bar.getAttr('init_x1'), dist_elem.getAttr('init_ci_min'), 0, 1);
    stage.setTransition(range_bar, 'x2', range_bar.getAttr('init_x2'), dist_elem.getAttr('init_ci_max'), 0, 1);
    stage.setTransition(range_bar, 'y1', range_bar.getAttr('init_y1'), dist_elem.getAttr('init_y'), 0, 1);
    stage.setTransition(range_bar, 'y2', range_bar.getAttr('init_y2'), dist_elem.getAttr('init_y'), 0, 1);
    stage.setTransition(range_bar, 'selected', 1, 0, 0, 1);
    stage.setTransition(range_bar, 'stroke-color', "orange", dist_elem.getAttr('in_ci') ? "green" : "red", 0, 1);
    stage.setTransition(dist_elem, 'stroke-opacity', 0, 1, 0.8, 1);
    stage.setTransition(dist_elem, 'fill-opacity', 0, 1, 0.8, 1);

    if(numeric) {
        for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
            let element = dynamic_elements.datapoints.all[i];
            stage.setTransition(element, 'selected', 1, 0, 0, 0);
        }
    }
    let total_count = 0;
    let in_count = 0;
    for(let j = 0; j < sample_index; j++){
        let elements_to_fit = 40;
        let bottom_index = Math.max(sample_index - elements_to_fit, 0);
        let index = j - bottom_index;
        let last_bottom_index = Math.max(sample_index - 1 - elements_to_fit, 0);
        let last_index = j - last_bottom_index;
        let d_element = dynamic_elements.distribution.datapoints[j];
        let new_y = d_element.calcLineHeapY(index);
        let old_y = d_element.calcLineHeapY(last_index);
        stage.setTransition(d_element, 'y', old_y, new_y, 0, 1);
        if(d_element.getAttr('in_ci')) in_count++;
        total_count++;
    }
    let old_text = `${in_count} / ${total_count}`;
    let old_percent_text = `${Math.round(in_count / total_count * 10000)/100}%`;
    if(dist_elem.getAttr('in_ci')) in_count++;
    total_count++;
    let new_text = `${in_count} / ${total_count}`;
    let new_percent_text = `${Math.round(in_count / total_count * 10000)/100}%`;
    let textbox = static_elements.ontop.filter((e) => String(e.id).includes('range_textbox'))[0];
    if(textbox){
        stage.setTransition(textbox, 'text', old_text, new_text, 0.5 , 0.5);
        stage.setTransition(textbox, 'percentage-text', old_percent_text, new_percent_text, 0.5 , 0.5);
    }
}

function dist_drop_devi_stage(static_elements, dynamic_elements, stage, sample_index, numeric){
    let stat_markers = dynamic_elements.stat_markers
                        .slice(0, dynamic_elements.stat_markers.length - 2)
                        .filter((e)=>e.type == 'arrow');
    let deviation_arrow = dynamic_elements.stat_markers[dynamic_elements.stat_markers.length - 1];
    let dist_elem = dynamic_elements.distribution.datapoints[sample_index];

    let y_pos = vis.areas['sec2display'].top;
    let middle_x = vis.areas['sec2display'].innerLeft + vis.areas['sec2display'].innerWidth/2;
    for(let i = 0; i < stat_markers.length; i++){
        let marker = stat_markers[i];
        let width = marker.attrs['x2'] - marker.attrs['x1'];
        stage.setTransition(marker, 'y1', marker.getAttr('init_y1'), y_pos, 0, 0.6);
        stage.setTransition(marker, 'y2', marker.getAttr('init_y2'), y_pos, 0, 0.6);
        stage.setTransition(marker, 'x1', marker.getAttr('init_x1'), middle_x - width/2, 0, 0.6);
        stage.setTransition(marker, 'x2', marker.getAttr('init_x2'), middle_x + width/2, 0, 0.6);
        stage.setTransition(marker, 'selected', 0, 1, 0, 0);

        y_pos += 10;
    }
    let width = deviation_arrow.attrs['x2'] - deviation_arrow.attrs['x1'];
    stage.setTransition(deviation_arrow, 'y1', deviation_arrow.getAttr('init_y1'), y_pos, 0, 0);
    stage.setTransition(deviation_arrow, 'y2', deviation_arrow.getAttr('init_y2'), y_pos, 0, 0);
    stage.setTransition(deviation_arrow, 'x1', deviation_arrow.getAttr('init_x1'), middle_x - width/2, 0, 0);
    stage.setTransition(deviation_arrow, 'x2', deviation_arrow.getAttr('init_x2'), middle_x + width/2, 0, 0);
    stage.setTransition(deviation_arrow, 'selected', 0, 0, 0, 0);
    stage.setTransition(deviation_arrow, 'stroke-opacity', 0, 1, 0.7, 1);
    if(numeric) {
        for(let i = 0; i < dynamic_elements.datapoints.all.length; i++){
            let element = dynamic_elements.datapoints.all[i];
            stage.setTransition(element, 'selected', 1, 0, 0, 0);
        }
    }


}

function dist_drop_devi_stage_2(static_elements, dynamic_elements, stage, sample_index, numeric){
    let stat_markers = dynamic_elements.stat_markers
                        .slice(0, dynamic_elements.stat_markers.length - 2)
                        .filter((e)=>e.type == 'arrow');
    let deviation_arrow = dynamic_elements.stat_markers[dynamic_elements.stat_markers.length - 1];
    let dist_elem = dynamic_elements.distribution.datapoints[sample_index];

    let y_pos = vis.areas['sec2display'].top;
    let middle_x = vis.areas['sec2display'].innerLeft + vis.areas['sec2display'].innerWidth/2;
    for(let i = 0; i < stat_markers.length; i++){
        let marker = stat_markers[i];
        stage.setTransition(marker, 'selected', 1, 0, 0, 0.3);

        y_pos += 10;
    }
    let width = deviation_arrow.attrs['x2'] - deviation_arrow.attrs['x1'];
    stage.setTransition(deviation_arrow, 'y1', y_pos, dist_elem.getAttr('y'), 0.3, 1);
    stage.setTransition(deviation_arrow, 'y2', y_pos, dist_elem.getAttr('y'), 0.3, 1);
    stage.setTransition(deviation_arrow, 'x1', middle_x - width/2, vis.areas['sec2display'].innerLeft,  0.3, 1);
    stage.setTransition(deviation_arrow, 'x2', middle_x + width/2, dist_elem.getAttr('x'), 0.3, 1);
    stage.setTransition(deviation_arrow, 'selected', 0, 1, 0, 0.3);


    stage.setTransition(dist_elem, 'stroke-opacity', 0, 1, 0.9, 1);
    stage.setTransition(dist_elem, 'fill-opacity', 0, 1, 0.9, 1);

}

function dist_drop_diff_stage(static_elements, dynamic_elements, stage, sample_index){
    let stat_marker = dynamic_elements.stat_markers[dynamic_elements.stat_markers.length - 1];
    let dist_elem = dynamic_elements.distribution.datapoints[sample_index];
    stage.setTransition(stat_marker, 'y1', stat_marker.getAttr('init_y1'), dist_elem.getAttr('init_y'), 0.2, 1);
    stage.setTransition(stat_marker, 'y2', stat_marker.getAttr('init_y2'), dist_elem.getAttr('init_y'), 0.2, 1);
    stage.setTransition(stat_marker, 'x1', stat_marker.getAttr('init_x1'), vis.areas["sec2display"].innerLeft + vis.areas["sec2display"].innerWidth/2, 0.2,  1);
    stage.setTransition(stat_marker, 'x2', stat_marker.getAttr('init_x2'), dist_elem.getAttr('init_x'), 0.2, 1);
    stage.setTransition(stat_marker, 'selected', 0, 1, 0, 0.1);
    stage.setTransition(dist_elem, 'stroke-opacity', 0, 1, 0.9, 1);
    stage.setTransition(dist_elem, 'fill-opacity', 0, 1, 0.9, 1);
}
function dist_drop_slope_stage(static_elements, dynamic_elements, stage, sample_index){
    let stat_marker = dynamic_elements.stat_markers[dynamic_elements.stat_markers.length - 1];
    let dist_elem = dynamic_elements.distribution.datapoints[sample_index];
    let dist_line = dynamic_elements.distribution.stats[sample_index][0];
    stage.setTransition(stat_marker, 'y1', stat_marker.getAttr('init_y1'), dist_line.getAttr('init_y1'), 0, 1);
    stage.setTransition(stat_marker, 'y2', stat_marker.getAttr('init_y2'), dist_line.getAttr('init_y2'), 0, 1);
    stage.setTransition(stat_marker, 'x1', stat_marker.getAttr('init_x1'), dist_line.getAttr('init_x1'), 0, 1);
    stage.setTransition(stat_marker, 'x2', stat_marker.getAttr('init_x2'), dist_line.getAttr('init_x2'), 0, 1);
    stage.setTransition(stat_marker, 'selected', 0, 1, 0, 0);
    stage.setTransition(dist_elem, 'stroke-opacity', 0, 1, 0.9, 1);
    stage.setTransition(dist_elem, 'fill-opacity', 0, 1, 0.9, 1);
}
function ma_createDistributionAnimation(animation, pop_dimensions, sample_dimensions, static_elements, dynamic_elements, module, speed, sample_index){
    let length = 3000;
    stage = new animStage('dist', animation.name, 10);
    if(module.name == "Bootstrapping"){
        stage.setFunc(()=>{
            if(!dd_showing) dd_toggle();
            dd_clearDatapoints({all: vis.samples[sample_index].all}, pop_dimensions, sample_dimensions);
            dd_updateDatapoints({all: vis.samples[sample_index].all}, pop_dimensions, sample_dimensions, false)
        });
    }
    for(let x = 0; x < 1000; x ++){
        let sample_markers = dynamic_elements.distribution.stats[x];
        for(let n = 0; n < sample_markers.length; n++){
            let sample_mark = sample_markers[n];
            let y1 = sample_mark.getAttr('init_y1');
            let y2 = sample_mark.getAttr('init_y2');
            let x1 = sample_mark.getAttr('init_x1');
            let x2 = sample_mark.getAttr('init_x2');
            stage.setTransition(sample_mark, 'stroke-opacity', 0, 0, 0, 0);
            stage.setTransition(sample_mark, 'fill-opacity', 0, 0, 0, 0);
            if(x1 != x2){
                stage.setTransition(sample_mark, 'y1', y1, y1, 0, 0);
                stage.setTransition(sample_mark, 'y2', y2, y2, 0, 0);

            }else{

                stage.setTransition(sample_mark, 'y2', y2 + (y1-y2)/1.5, y2 + (y1-y2)/1.5, 0, 1);
            }
            
        }
        let dist_datapoint = dynamic_elements.distribution.datapoints[x];
        stage.setTransition(dist_datapoint, 'stroke-opacity', 0, 0, 0, 0);
        stage.setTransition(dist_datapoint, 'fill-opacity', 0, 0, 0, 0);
    }
    animation.addStage(stage);
    let step = 10;
    for(let i = 0; i < 1000; i += step){
        stage = new animStage('dist', animation.name, length / (1000 / step));
        stage.setFunc(function(){
            vis.dynamicElements.all = [];
            for(let n = 0; n < vis.dynamicElements.distribution.stats.length && n <= i; n++){
                vis.dynamicElements.all = vis.dynamicElements.all.concat(vis.dynamicElements.distribution.stats[n]);
                vis.dynamicElements.all = vis.dynamicElements.all.concat([vis.dynamicElements.distribution.datapoints[n]]);
            }
            vis.initSample(vis.samples[i], vis.dynamicElements.distribution.stats[i], false);
        });
        for(let j = i - step + 1; j <= i; j++ ){
            if(j < 0) continue;
            if(module.name != "Confidence Interval"){
                let sample_markers = dynamic_elements.distribution.stats[j];
                for(let n = 0; n < sample_markers.length; n++){
                    let sample_mark = sample_markers[n];
                    stage.setTransition(sample_mark, 'stroke-opacity', 0, 0.2, 0, 0);
                }
            }
            let dist_datapoint = dynamic_elements.distribution.datapoints[j];
            stage.setTransition(dist_datapoint, 'stroke-opacity', 0, 1, 0, 0.2);
            stage.setTransition(dist_datapoint, 'fill-opacity', 0, 1, 0, 0);
        }
        let range_bar = dynamic_elements.distribution.stats[i].filter((e) => String(e.id).includes('stay'))[0];
        if(range_bar){
            stage.setTransition(range_bar, 'stroke-opacity', 0, 1, 0, 0);
            stage.setTransition(range_bar, 'fill-opacity', 0, 1, 0, 0);
            stage.setTransition(range_bar, 'selected', 0, 1, 0, 0);
            stage.setTransition(range_bar, 'lineWidth', 1, 3, 0, 0);
        }
        if(i - step > 0){
            let last_range_bar = dynamic_elements.distribution.stats[i - step].filter((e) => String(e.id).includes('stay'))[0];
            if(range_bar){
                stage.setTransition(last_range_bar, 'stroke-opacity', 0, 0, 0, 0);
                stage.setTransition(last_range_bar, 'fill-opacity', 0, 0, 0, 0);
                stage.setTransition(last_range_bar, 'selected', 0, 0, 0, 0);
            }
        }
        if(dynamic_elements.distribution.datapoints[0].type == "distribution_range"){
            let total_count = 0;
            let in_count = 0;
            for(let j = 0; j < i; j++){
                let elements_to_fit = 40;
                let bottom_index = Math.max(i - elements_to_fit, 0);
                let index = j - bottom_index;
                let last_bottom_index = Math.max(i - 1 - elements_to_fit, 0);
                let last_index = j - last_bottom_index;
                let d_element = dynamic_elements.distribution.datapoints[j];
                let new_y = d_element.calcLineHeapY(index);
                let old_y = d_element.calcLineHeapY(last_index);
                stage.setTransition(d_element, 'y', old_y, new_y, 0, 1);
                if(d_element.getAttr('in_ci')) in_count++;
                total_count++;
            }
            let old_text = `${in_count} / ${total_count}`;
            let old_percent_text = `${Math.round(in_count / total_count * 10000)/100}%`;
            if(dynamic_elements.distribution.datapoints[i].getAttr('in_ci')) in_count++;
            total_count++;
            let new_text = `${in_count} / ${total_count}`;
            let new_percent_text = `${Math.round(in_count / total_count * 10000)/100}%`;
            let textbox = static_elements.ontop.filter((e) => String(e.id).includes('range_textbox'))[0];
            if(textbox){
                stage.setTransition(textbox, 'text', old_text, new_text, 0.5 , 0.5);
                stage.setTransition(textbox, 'percentage-text', old_percent_text, new_percent_text, 0.5 , 0.5);
            }
        }
        animation.addStage(stage);
    }
    return animation;
}

function ma_createCIAnimation(animation, pop_dimensions, sample_dimensions, static_elements, dynamic_elements, module, speed, sample_index, areas, largeCI){
    stage = new animStage('dist', animation.name, 200);
    stage.setFunc(function(){
        for(let i = 0; i < dynamic_elements.distribution.ci.length; i++){
            let ci_element = dynamic_elements.distribution.ci[i];
            for(let e = 0; e < Object.keys(ci_element.attrs).length; e++){
                let attr = Object.keys(ci_element.attrs)[e];
                if(attr.includes('init_large') && largeCI){
                    let attr_value = ci_element.getAttr(attr);
                    let replace_name = attr.split('_').slice(2).join('_');
                    ci_element.setAttr(replace_name, attr_value);
                }else if(attr.includes('init_') && !attr.includes('large_') && !largeCI){
                    let attr_value = ci_element.getAttr(attr);
                    let replace_name = attr.split('_').slice(1).join('_');
                    ci_element.setAttr(replace_name, attr_value);
                }
            }
        }  
    });
    let ci_num_line = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_num_line")[0];
    let ci_num_text = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_num_text")[0];
    animation.addStage(stage);
    if(sample_dimensions.length > 1 && sample_dimensions[1].type == 'categoric' && sample_dimensions[1].factors.length > 1){
        stage = new animStage('dist', animation.name, 1000);
        let text_margin = areas['sec2axis'].height;
        stage.setFunc(function(){
            vis.dynamicElements.all = [];
            for(let i = 0; i < vis.dynamicElements.distribution.stats.length; i++){
                //vis.dynamicElements.all = vis.dynamicElements.all.concat(vis.dynamicElements.distribution.stats[i]);
                vis.dynamicElements.all = vis.dynamicElements.all.concat([vis.dynamicElements.distribution.datapoints[i]]);
            }
            vis.dynamicElements.all = vis.dynamicElements.all.concat(vis.dynamicElements.distribution.ci);
        });
        for(let i = 0; i < dynamic_elements.distribution.datapoints.length; i++){
            let dist_datapoint = dynamic_elements.distribution.datapoints[i];
            let opacity = dist_datapoint.getAttr('in_ci') ? 1 : 0.2;
            stage.setTransition(dist_datapoint, 'stroke-opacity', 1, opacity, 0, 1);
            stage.setTransition(dist_datapoint, 'fill-opacity', 1, opacity, 0, 1);
        }
        for(let i = 0; i < dynamic_elements.distribution.ci.length; i++){
            let dist_datapoint = dynamic_elements.distribution.ci[i];
            stage.setTransition(dist_datapoint, 'stroke-opacity', 0, 0, 0, 1);
            stage.setTransition(dist_datapoint, 'fill-opacity', 0, 0, 0, 1);
        }
        animation.addStage(stage);
        let ci_pop_stat_arrow = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_pop_stat_arrow")[0];
        let ci_pop_stat_text = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_pop_stat_text")[0];

        stage = new animStage('dist', animation.name, 1000);
        stage.setTransition(ci_pop_stat_arrow, 'stroke-opacity', 0, 1, 0, 1);
        stage.setTransition(ci_pop_stat_arrow, 'fill-opacity', 0, 1, 0, 1);
        stage.setTransition(ci_pop_stat_text, 'stroke-opacity', 0, 1, 0, 1);
        stage.setTransition(ci_pop_stat_text, 'fill-opacity', 0, 1, 0, 1);
        animation.addStage(stage);
        stage = new animStage('dist', animation.name, 1000);
        stage.setTransition(ci_pop_stat_arrow, 'x1', ci_pop_stat_arrow.getAttr('init_x1'), ci_pop_stat_arrow.getAttr('dist_x1'), 0, 1);
        stage.setTransition(ci_pop_stat_arrow, 'x2', ci_pop_stat_arrow.getAttr('init_x2'), ci_pop_stat_arrow.getAttr('dist_x2'), 0, 1);
        stage.setTransition(ci_pop_stat_text, 'x', ci_pop_stat_text.getAttr('init_x'), sample_dimensions[1].factors.length > 2 ? (ci_pop_stat_arrow.getAttr('dist_x1') + ci_pop_stat_arrow.getAttr('dist_x2')) / 2 : ci_pop_stat_arrow.getAttr('dist_x2'), 0, 1);
        stage.setTransition(ci_pop_stat_arrow, 'y1', ci_pop_stat_arrow.getAttr('init_y1'), areas['sec2display'].bottom, 0, 1);
        stage.setTransition(ci_pop_stat_arrow, 'y2', ci_pop_stat_arrow.getAttr('init_y2'), areas['sec2display'].bottom, 0, 1);
        stage.setTransition(ci_pop_stat_text, 'y', ci_pop_stat_text.getAttr('init_y'), areas['sec2display'].bottom + (sample_dimensions[1].factors.length > 2 ? 0 : (text_margin / 1.5)), 0, 1);
        //stage.setTransition(ci_pop_stat_text, 'alignment-baseline', 'hanging', 0, 1);
        animation.addStage(stage);
        stage = new animStage('dist', animation.name, 1000);
        for(let i = 0; i < dynamic_elements.distribution.ci.length; i++){
            let dist_datapoint = dynamic_elements.distribution.ci[i];
            if(dist_datapoint == ci_pop_stat_arrow || dist_datapoint == ci_pop_stat_text || dist_datapoint == ci_num_line || dist_datapoint == ci_num_text) continue;
            stage.setTransition(dist_datapoint, 'stroke-opacity', 0, 1, 0, 1);
            stage.setTransition(dist_datapoint, 'fill-opacity', 0, 1, 0, 1);
        }
        animation.addStage(stage);
        
    }else{
        stage = new animStage('dist', animation.name, 1000);
        let text_margin = areas['sec2axis'].height;
        stage.setFunc(function(){
            vis.dynamicElements.all = [];
            for(let i = 0; i < vis.dynamicElements.distribution.stats.length; i++){
                //vis.dynamicElements.all = vis.dynamicElements.all.concat(vis.dynamicElements.distribution.stats[i]);
                vis.dynamicElements.all = vis.dynamicElements.all.concat([vis.dynamicElements.distribution.datapoints[i]]);
            }
            vis.dynamicElements.all = vis.dynamicElements.all.concat(vis.dynamicElements.distribution.ci);
        });
        for(let i = 0; i < dynamic_elements.distribution.datapoints.length; i++){
            let dist_datapoint = dynamic_elements.distribution.datapoints[i];
            let opacity = dist_datapoint.getAttr('in_ci') ? 1 : 0.2;
            stage.setTransition(dist_datapoint, 'stroke-opacity', 1, opacity, 0, 1);
            stage.setTransition(dist_datapoint, 'fill-opacity', 1, opacity, 0, 1);
        }
        for(let i = 0; i < dynamic_elements.distribution.ci.length; i++){
            let dist_datapoint = dynamic_elements.distribution.ci[i];
            stage.setTransition(dist_datapoint, 'stroke-opacity', 0, 0, 0, 1);
            stage.setTransition(dist_datapoint, 'fill-opacity', 0, 0, 0, 1);
        }
        animation.addStage(stage);
    
        stage = new animStage('dist', animation.name, 1000);
        for(let i = 0; i < dynamic_elements.distribution.ci.length; i++){
            let dist_datapoint = dynamic_elements.distribution.ci[i];
            stage.setTransition(dist_datapoint, 'stroke-opacity', 0, 1, 0, 1);
            stage.setTransition(dist_datapoint, 'fill-opacity', 0, 1, 0, 1);
        }
        animation.addStage(stage);
        stage = new animStage('dist', animation.name, 1000);
        let cross_bar = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_cross_bar")[0];
        let cross_bar_mid = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_cross_bar_mid")[0];
        let cross_bar_top = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_cross_bar_top")[0];
        let ci_min = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_min")[0];
        let ci_max = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_max")[0];
        let ci_min_text = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_min_text")[0];
        let ci_max_text = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_max_text")[0];
        let ci_min_top = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_min_top")[0];
        let ci_max_top = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_max_top")[0];
        let ci_min_text_top = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_min_text_top")[0];
        let ci_max_text_top = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_max_text_top")[0];
        stage.setTransition(cross_bar_mid, 'y1', cross_bar.getAttr('y1'), areas['sec1display'].split(8, 7)[1], 0, 1);
        stage.setTransition(cross_bar_mid, 'y2', cross_bar.getAttr('y2'), areas['sec1display'].split(8, 7)[1], 0, 1);
        stage.setTransition(cross_bar_top, 'y1', cross_bar.getAttr('y1'), areas['sec1display'].split(8, 7)[1], 0, 1);
        stage.setTransition(cross_bar_top, 'y2', cross_bar.getAttr('y2'), areas['sec1display'].split(8, 7)[1], 0, 1);
        stage.setTransition(ci_min_top, 'y1', ci_min.getAttr('y1'), areas['sec1display'].split(8, 7)[1], 0, 1);
        stage.setTransition(ci_min_top, 'y2', ci_min.getAttr('y2'), areas['sec1display'].split(8, 8)[1], 0, 1);
        stage.setTransition(ci_max_top, 'y1', ci_max.getAttr('y1'), areas['sec1display'].split(8, 7)[1], 0, 1);
        stage.setTransition(ci_max_top, 'y2', ci_max.getAttr('y2'), areas['sec1display'].split(8, 8)[1], 0, 1);
        stage.setTransition(ci_min_text_top, 'y', ci_min_text.getAttr('y'), areas['sec1display'].split(8, 8)[1], 0, 1);
        stage.setTransition(ci_max_text_top, 'y', ci_max_text.getAttr('y'), areas['sec1display'].split(8, 8)[1], 0, 1);
        animation.addStage(stage);
        stage = new animStage('dist', animation.name, 1000);
        stage.setTransition(cross_bar_top, 'y1', areas['sec1display'].split(8, 7)[1], areas['sec0display'].split(8, 7)[1], 0, 1);
        stage.setTransition(cross_bar_top, 'y2', areas['sec1display'].split(8, 7)[1], areas['sec0display'].split(8, 7)[1], 0, 1);
        stage.setTransition(ci_min_top, 'y1', areas['sec1display'].split(8, 7)[1], areas['sec0display'].split(8, 7)[1], 0, 1);
        stage.setTransition(ci_min_top, 'y2', areas['sec1display'].split(8, 8)[1], areas['sec0display'].split(8, 8)[1], 0, 1);
        stage.setTransition(ci_max_top, 'y1', areas['sec1display'].split(8, 7)[1], areas['sec0display'].split(8, 7)[1], 0, 1);
        stage.setTransition(ci_max_top, 'y2', areas['sec1display'].split(8, 8)[1], areas['sec0display'].split(8, 8)[1], 0, 1);
        stage.setTransition(ci_min_text_top, 'y', areas['sec1display'].split(8, 8)[1], areas['sec0display'].split(8, 8)[1] + text_margin, 0, 1);
        stage.setTransition(ci_max_text_top, 'y', areas['sec1display'].split(8, 8)[1], areas['sec0display'].split(8, 8)[1] + text_margin, 0, 1);
        animation.addStage(stage);
         
    }

    return animation;
}
function ma_createRandTestCIAnimation(animation, pop_dimensions, sample_dimensions, static_elements, dynamic_elements, module, speed, sample_index, areas, largeCI){
    stage = new animStage('dist', animation.name, 200);
    stage.setFunc(function(){
        for(let i = 0; i < dynamic_elements.distribution.ci.length; i++){
            let ci_element = dynamic_elements.distribution.ci[i];
            for(let e = 0; e < Object.keys(ci_element.attrs).length; e++){
                let attr = Object.keys(ci_element.attrs)[e];
                if(attr.includes('init_large') && largeCI){
                    let attr_value = ci_element.getAttr(attr);
                    let replace_name = attr.split('_').slice(2).join('_');
                    ci_element.setAttr(replace_name, attr_value);
                }else if(attr.includes('init_') && !attr.includes('large_') && !largeCI){
                    let attr_value = ci_element.getAttr(attr);
                    let replace_name = attr.split('_').slice(1).join('_');
                    ci_element.setAttr(replace_name, attr_value);
                }
            }
        }  
    });
    animation.addStage(stage);
    stage = new animStage('dist', animation.name, 1000);
    let text_margin = areas['sec2axis'].height;
    stage.setFunc(function(){
        vis.dynamicElements.all = [];
        for(let i = 0; i < vis.dynamicElements.distribution.stats.length; i++){
            //vis.dynamicElements.all = vis.dynamicElements.all.concat(vis.dynamicElements.distribution.stats[i]);
            vis.dynamicElements.all = vis.dynamicElements.all.concat([vis.dynamicElements.distribution.datapoints[i]]);
        }
        vis.dynamicElements.all = vis.dynamicElements.all.concat(vis.dynamicElements.distribution.ci);
    });
    for(let i = 0; i < dynamic_elements.distribution.datapoints.length; i++){
        let dist_datapoint = dynamic_elements.distribution.datapoints[i];
        let opacity = dist_datapoint.getAttr('in_ci') ? 1 : 0.2;
        stage.setTransition(dist_datapoint, 'stroke-opacity', 1, opacity, 0, 1);
        stage.setTransition(dist_datapoint, 'fill-opacity', 1, opacity, 0, 1);
    }
    for(let i = 0; i < dynamic_elements.distribution.ci.length; i++){
        let dist_datapoint = dynamic_elements.distribution.ci[i];
        stage.setTransition(dist_datapoint, 'stroke-opacity', 0, 0, 0, 1);
        stage.setTransition(dist_datapoint, 'fill-opacity', 0, 0, 0, 1);
    }
    animation.addStage(stage);
    let ci_pop_stat_arrow = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_pop_stat_arrow")[0];
    let ci_pop_stat_text = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_pop_stat_text")[0];
    let ci_num_line = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_num_line")[0];
    let ci_num_text = dynamic_elements.distribution.ci.filter((e) => e.id == "ci_num_text")[0];

    stage = new animStage('dist', animation.name, 1000);
    stage.setTransition(ci_pop_stat_arrow, 'stroke-opacity', 0, 1, 0, 1);
    stage.setTransition(ci_pop_stat_arrow, 'fill-opacity', 0, 1, 0, 1);
    stage.setTransition(ci_pop_stat_text, 'stroke-opacity', 0, 1, 0, 1);
    stage.setTransition(ci_pop_stat_text, 'fill-opacity', 0, 1, 0, 1);

    animation.addStage(stage);
    stage = new animStage('dist', animation.name, 1000);
    stage.setTransition(ci_pop_stat_arrow, 'x1', ci_pop_stat_arrow.getAttr('init_x1'), ci_pop_stat_arrow.getAttr('dist_x1'), 0, 1);
    stage.setTransition(ci_pop_stat_arrow, 'x2', ci_pop_stat_arrow.getAttr('init_x2'), ci_pop_stat_arrow.getAttr('dist_x2'), 0, 1);
    stage.setTransition(ci_pop_stat_text, 'x', ci_pop_stat_text.getAttr('init_x'), sample_dimensions[1].factors.length > 2 ? (ci_pop_stat_arrow.getAttr('dist_x1') + ci_pop_stat_arrow.getAttr('dist_x2')) / 2 : ci_pop_stat_arrow.getAttr('dist_x2'), 0, 1);
    stage.setTransition(ci_pop_stat_arrow, 'y1', ci_pop_stat_arrow.getAttr('init_y1'), areas['sec2display'].bottom, 0, 1);
    stage.setTransition(ci_pop_stat_arrow, 'y2', ci_pop_stat_arrow.getAttr('init_y2'), areas['sec2display'].bottom, 0, 1);
    stage.setTransition(ci_pop_stat_text, 'y', ci_pop_stat_text.getAttr('init_y'), areas['sec2display'].bottom + (sample_dimensions[1].factors.length > 2 ? 0 : (text_margin / 1.5)), 0, 1);
    //stage.setTransition(ci_pop_stat_text, 'alignment-baseline', 'hanging', 0, 1);
    animation.addStage(stage);

    stage = new animStage('dist', animation.name, 1000);
    stage.setTransition(ci_num_line, 'stroke-opacity', 0, 1, 0, 1);
    stage.setTransition(ci_num_line, 'fill-opacity', 0, 1, 0, 1);
    stage.setTransition(ci_num_line, 'selected', 0, 1, 0, 0);
    stage.setTransition(ci_num_text, 'stroke-opacity', 0, 1, 0, 1);
    stage.setTransition(ci_num_text, 'fill-opacity', 0, 1, 0, 1);
    stage.setTransition(ci_num_text, 'selected', 0, 1, 0, 0);
    animation.addStage(stage);
    
    

    return animation;
}
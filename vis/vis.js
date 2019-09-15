const vis = {
    init: function(width, height){
        this.destroy();
        this.width = width;
        this.height = height;
        this.areas = sectionAreas({top: 0, left: 0, right: width, bottom: height, width: width, height: height});

        this.current_stage = 0;
        this.last_frame = null;
        this.current_animation_percent = 0;
        this.paused = false;
        this.loop_started = false;
        this.reqAnimationFrame = undefined;
        this.static_draw_index = 0;
        this.current_sample = 0;
        this.last_animation_type = undefined;

    },
    initModule: function(module, options){
        this.module = module;
        this.options = options;
    },
    initDimensions: function(population_dimensions, sample_dimensions){
        this.dimensions = population_dimensions;
        this.population_dimensions = population_dimensions;
        this.sample_dimensions = sample_dimensions;
    },
    initOptions: function(options){
        this.options = options;
    },
    initDataset(dataset, dimensions, container_svg, area, name, is_population, domain, range){
        const svg = document.querySelector(container_svg); 
        const ds_domain = domain || [dataset.statistics.overall.point_stats.Min, dataset.statistics.overall.point_stats.Max];
        const ds_range = range || [this.areas[`${area}axis`].innerLeft  + this.areas[`${area}axis`].margin, this.areas[`${area}axis`].innerRight - this.areas[`${area}axis`].margin];
        createStaticLabels(dimensions, this.areas[`${area}display`], svg, is_population);
        createElementsFromDataset(dataset, this.options, this.areas[`${area}display`], ds_domain, ds_range, dimensions, name, svg, is_population);
        createStatMarkersFromDataset(dataset, this.options, this.areas, this.areas[`${area}display`], ds_domain, ds_range, dimensions, `${name}_stats`, svg, is_population);
        createAnalysisMarkersFromDataset(dataset, this.options, this.areas, this.areas[`${area}display`], ds_domain, ds_range, dimensions, `${name}_analysis`, svg, is_population);
        let scale = d3.scaleLinear().domain(ds_domain).nice();
        scale.range(ds_range)
        createAxis(scale, this.areas[`${area}axis`], dimensions, `${name}_axis`, svg, is_population)

        return [scale];
    },
    initPopulation: function(dataset){
        clearSvg('popSVG');
        createSectionLabels(this.module.labels, this.areas);
        this.population_dataset = dataset;
        this.population_domain = [dataset.statistics.overall.point_stats.Min, dataset.statistics.overall.point_stats.Max];
        this.population_range = [this.areas[`sec0axis`].innerLeft  + this.areas[`sec0axis`].margin, this.areas[`sec0axis`].innerRight - this.areas[`sec0axis`].margin];
        [this.population_scale] = this.initDataset(dataset, this.population_dimensions, '#popSVG', 'sec0', 'population', true, this.population_domain, this.population_range); 
    },
    initSamples: function(samples, distribution){
        this.current_sample = 0;
        this.samples = samples;
        this.distribution = distribution;
        clearSvg('dynamicSVG');
        clearSvg('ghostSVG');
        this.initSampleGhosts(this.sample_dimensions, '#ghostSVG', 'sec1', this.population_domain, this.population_range);
        this.initDistribution(this.distribution, this.sample_dimensions, '#ghostSVG', 'sec2', this.population_domain, this.population_range);
        this.initSample(this.current_sample, true);
        
        //this.initSample(this.samples[this.current_sample], this.dynamicElements.distribution.stats[this.current_sample], true);
        
        // this.drawDynamic();
    },
    initSample: function(sample_id, dist){
        clearSvg('dynamicSVG');
        let sample_ghost_container = document.querySelector(`#sample-${sample_id}-ghosts`);
        let sample_ghosts = sample_ghost_container.querySelectorAll('*');
        for(ghost of sample_ghosts){
            ghost.style.removeProperty('display');
        }
        let distribution_container = document.querySelector(`#distribution-${sample_id}`);
        let distributions = distribution_container.querySelectorAll('*');
        for(dist of distributions){
            dist.style.removeProperty('display');
        }
        this.initDataset(this.samples[sample_id], this.sample_dimensions, '#dynamicSVG', 'sec1', `sample_${sample_id}`, false, this.population_domain, this.population_range); 
        dd_updateDatapoints(this.samples[sample_id], this.population_dimensions, this.sample_dimensions);
    },
    initPreview: function(dataset){

    },
    initSampleGhosts: function(dimensions, container_svg, area, domain, range){
        const ds_domain = domain;
        const ds_range = range;
        const svg = document.querySelector(container_svg); 
        let sample_elements = createSampleGhosts(this.samples, this.options, this.areas, this.areas[`${area}display`], ds_domain, ds_range, dimensions, `sample-ghosts-container`, svg, false);
        
    },
    
    initDistribution: function(distribution, dimensions, container_svg, area, domain, range){

        let distribution_stats = getDistributionStats(distribution);
        let get_in_ci = (dp) => {return this.module.inCI(distribution_stats, this.population_dataset.statistics, this.population_dataset.statistics.overall.analysis[this.options.Statistic][this.options.popAnalysis], dp)};
        let ds_domain = domain;
        const ds_range = range;
        if(this.options.Analysis == "Difference"){
            let domain_width = domain[1] - domain[0];
            ds_domain = [0 - domain_width/2, 0 + domain_width / 2];
        }
        if(this.options.Analysis == "Average Deviation" || this.options.Analysis == "F Stat"){
            let domain_width = domain[1] - domain[0];
            ds_domain = [0, 0 + domain_width];
        }
        let scale = d3.scaleLinear().domain(ds_domain).nice();
        scale.range(ds_range)
        const svg = document.querySelector(container_svg); 
        let sample_elements = createDistribution(distribution, this.options, this.areas, this.areas[`${area}display`], ds_domain, ds_range, dimensions, `distribution-container`, svg, false, get_in_ci);
        createAxis(scale, this.areas[`${area}axis`], dimensions, `${name}_axis`, svg, false)
        // let statistic = this.options.Statistic;
        // let min = 0;
        // let max = 1;
        // if(statistic == "Slope"){
        //     max = distribution.reduce((a, c)=> c.point_value > a ? c.point_value : a, -100000);
        //     min = distribution.reduce((a, c)=> c.point_value < a ? c.point_value : a, 100000);
        //     min =Math.min(min, 0);
        //     max = Math.max(0, max);
        // }else if(this.sample_dimensions.length < 2 && statistic == 'proportion'){
        //     max = 1;
        //     min = 0; 
        // }else if(this.sample_dimensions.length > 1 && this.sample_dimensions[1].factors.length == 2){
        //     max = 0 + (this.popMax - this.popMin)/2;
        //     min = 0 - (this.popMax - this.popMin)/2; 
        // }else if(this.sample_dimensions.length > 1 && this.sample_dimensions[1].factors.length > 2){
        //     max = 0 + (this.popMax - this.popMin);
        //     min = 0; 
        // }else {
        //     max = this.popMax;
        //     min = this.popMin; 
        // }
        
        // let area_heap = this.areas["sec2display"];
        // let area_stat = this.areas["sec1display"];
        // let area_axis = this.areas["sec2axis"];
        // let vertical = false;
        // if(this.sample_dimensions.length == 2 && this.sample_dimensions[0].type == 'numeric' && this.sample_dimensions[1].type == 'numeric'){
        //     area_heap = this.areas["sec2regRdisplay"];
        //     area_stat = this.areas["sec2regLdisplay"];
        //     area_axis = this.areas["sec2regRaxis"];
        //     vertical = true;
        // }
        // let [datapoints, stats, ci, extra] = elementsFromDistribution(
        //         distribution,
        //         this.samples,
        //         this.sample_dimensions,
        //         area_stat, this.options,
        //         this.popMin,
        //         this.popMax,
        //         min,
        //         max,
        //         this.module.inCI,
        //         getPopulationStatistic(this.dataset, statistic, this.dimensions),
        //         this.dataset.largeCI
        //     );
        // placeDistribution(datapoints, ci, area_heap, vertical, min, max, this.staticElements.stat_markers, this.dataset.largeCI);
        // this.dynamicElements.distribution = {};
        // this.dynamicElements.distribution.datapoints = datapoints;
        // let prev_all = this.dynamicElements.all || [];
        // //this.dynamicElements.all = prev_all.concat(datapoints);
        // this.dynamicElements.distribution.stats = stats;
        // this.dynamicElements.distribution.ci = ci;
        

        // let axis = axisFromDataset(area_axis, min, max, vertical);
        // this.staticElements.dist_axis = axis;
        // this.staticElements.all = this.staticElements.all.concat(axis);

        // if(extra) this.staticElements.ontop = this.staticElements.ontop.concat(extra);

        // this.drawDynamic();
    },

    initSampleDistElements(datapoints){
        this.dynamicElements.all = [].concat(datapoints.all);
        this.dynamicElements.ghosts = [];
        this.dynamicElements.new_ghosts = [];
        this.dynamicElements.stat_markers = [];
        for(let i = 0; i < this.dynamicElements.distribution.stats.length && i < this.current_sample; i++){
            //this.dynamicElements.all = this.dynamicElements.all.concat(this.dynamicElements.distribution.stats[i]);
            this.dynamicElements.ghosts = this.dynamicElements.ghosts.concat(this.dynamicElements.distribution.stats[i]);
            this.dynamicElements.all = this.dynamicElements.all.concat(this.dynamicElements.distribution.stats[i]);
            this.dynamicElements.all = this.dynamicElements.all.concat([this.dynamicElements.distribution.datapoints[i]]);
        }
        this.dynamicElements.new_ghosts.push(this.dynamicElements.distribution.stats[this.current_sample]);
        this.dynamicElements.all.push(this.dynamicElements.distribution.datapoints[this.current_sample]);
    },
    initAnimation: function(reps, include_distribution, track, inherit_speed = false){
        this.initSample(this.current_sample, true);
        this.current_sample++;
        if (reps > 0){
            setTimeout(this.initAnimation.bind(this, reps - 1, include_distribution, track, inherit_speed), 100);
        }
        // this.pause();
        // this.reps_left = reps - 1;
        // // let speed = this.speed || 1 + 0.75*(reps - 1);
        // let speed = inherit_speed ? this.speed : (1 + 0.75*(reps - 1)) * (1 + 1 * include_distribution);
        // this.speed = speed;
        // this.include_distribution = include_distribution;
        // let animation = new Animation(`${reps}:${include_distribution}`);
        // if(reps < 900){
        //     if(this.current_sample >= 1000){
        //         this.current_sample = 0;
        //         this.dynamicElements.all = [];
        //     }
        //     this.initSample(this.samples[this.current_sample], this.dynamicElements.distribution.stats[this.current_sample], true);
            
        //     ma_createAnimation(animation, this.population_dimensions, this.sample_dimensions, this.staticElements, this.dynamicElements, this.module, speed, this.current_sample, include_distribution, track);
        //     this.animation = animation;
        //     this.animation.start();
        //     this.current_sample = (this.current_sample + 1)%(this.samples.length);
        // }else{
        //     if(this.current_sample >= 1000){
        //         this.current_sample = 0;
        //         this.dynamicElements.all = [];
        //     }
        //     this.dynamicElements.all = [];
        //     for(let i = 0; i < this.dynamicElements.distribution.stats.length; i++){
        //         this.dynamicElements.all = this.dynamicElements.all.concat(this.dynamicElements.distribution.stats[i]);
        //         this.dynamicElements.all = this.dynamicElements.all.concat([this.dynamicElements.distribution.datapoints[i]]);
        //     }
        //     ma_createDistributionAnimation(animation, this.population_dimensions, this.sample_dimensions, this.staticElements, this.dynamicElements, this.module, 1, this.current_sample);
        //     this.animation = animation;
        //     this.animation.start();
        //     this.current_sample = 1000;
        //     this.reps_left = 0;
        // }
        // this.last_animation_type = "normal";
        // [this.current_stage, this.current_animation_percent]  = this.animation.progress_time(window.performance.now());
        // this.paused = false;
        // ac_unpause();
        // this.last_frame = window.performance.now();
        // if(!this.loop_started) {
        //     this.loop(window.performance.now(), true);
        //     this.loop_started = true;
        // }

    },
    initCIAnimation(large){
        this.reps_left = 0;
        let speed = 1;
        this.include_distribution = false;
        let animation = new Animation(`ci`);
        ma_createCIAnimation(animation, this.population_dimensions, this.sample_dimensions, this.staticElements, this.dynamicElements, this.module, speed, this.current_sample, this.areas, large);
        this.animation = animation;
        this.animation.start();
        
        [this.current_stage, this.current_animation_percent]  = this.animation.progress_time(window.performance.now());
        if(this.last_animation_type == "ci"){
            this.setProgress(1);
        }
        this.last_animation_type = "ci";
        this.paused = false;
        ac_unpause();
        this.last_frame = window.performance.now();
        if(!this.loop_started) {
            this.loop(window.performance.now());
            this.loop_started = true;
        }
    },
    initRandTestCIAnimation(large){
        this.reps_left = 0;
        let speed = 1;
        this.include_distribution = false;
        let animation = new Animation(`ci`);
        ma_createRandTestCIAnimation(animation, this.population_dimensions, this.sample_dimensions, this.staticElements, this.dynamicElements, this.module, speed, this.current_sample, this.areas, large);
        this.animation = animation;
        this.animation.start();
        [this.current_stage, this.current_animation_percent]  = this.animation.progress_time(window.performance.now());
        if(this.last_animation_type == "randci"){
            this.setProgress(1);
        }
        this.last_animation_type = "randci";
        this.paused = false;
        ac_unpause();
        this.last_frame = window.performance.now();
        if(!this.loop_started) {
            this.loop(window.performance.now());
            this.loop_started = true;
        }
    },
    initInterpolators: function(interpolators){
        this.interpolators = interpolators;
    },
    initStageInitials: function(initials){
        for(let i = 0; i < initials.length; i++){
            let initial = initials[i];
            let element = initial.el;
            let attr = initial.attr;
            let value = initial.value;
            element.setAttr(attr, value);
        }
    },
    updateStatic: function(stage_percentage){
        if(!this.animation.playing) return;
        for(let i = 0; i < this.interpolators.length; i++){
            let interpolator = this.interpolators[i];
            let element = interpolator.el;

            let attr = interpolator.attr;
            let value = interpolator.value(stage_percentage);
            element.setAttr(attr, value);
        }
    },
    updateDynamic: function(stage_percentage){
        if(!this.animation.playing) return;
        for(let i = 0; i < this.interpolators.length; i++){
            let interpolator = this.interpolators[i];
            let element = interpolator.el;
            let attr = interpolator.attr;
            let value = interpolator.value(stage_percentage);
            element.setAttr(attr, value);
        }
    },
    drawStatic: function(){
        let ctx = this.ctx;
        clearCtx(ctx);
        for(let i = 0; i < this.staticElements.all.length; i++){
            let element = this.staticElements.all[i];

            if(config.element_draw_type[element.type] == "canvas"){
                element.draw(ctx);
            }else if(config.element_draw_type[element.type] == "svg"){
                if(!element.svg_initialised || d3.select('#' + element.svg_id).empty()){
                    let svg_id = '#popSvgContainer';
                    defaultSVGFuncs[element.type](element, svg_id);
                    element.svg_initialised = true;
                }
                element.svgUpdate();
            }
            
        }
    },
    drawStaticOnTop: function(){
        let ctx = this.staticOnTopCtx;
        clearCtx(ctx);
        for(let i = 0; i < this.staticElements.ontop.length; i++){
            let element = this.staticElements.ontop[i];

            if(config.element_draw_type[element.type] == "canvas"){
                element.draw(ctx);
            }else if(config.element_draw_type[element.type] == "svg"){
                if(!element.svg_initialised || d3.select('#' + element.svg_id).empty()){
                    let svg_id = '#popSvgContainer';
                    defaultSVGFuncs[element.type](element, svg_id);
                    element.svg_initialised = true;
                }
                element.svgUpdate();
            }
            
        }
    },
    testSections: function(){
        for(let i in this.areas){
            this.ctx.fillStyle = "rgb("+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+")";
            this.ctx.fillRect(parseInt(this.areas[i].left), this.areas[i].top, this.areas[i].width, this.areas[i].height); 
        }
    },
    drawDynamic: function(){
        let ctx = this.dynamicCtx;
        clearCtx(ctx);
        if(!this.dynamicElements.all) return;
        for(let i = 0; i < this.dynamicElements.all.length; i++){
            let element = this.dynamicElements.all[i];
            if(config.element_draw_type[element.type] == "canvas"){
                element.draw(ctx);
            }else if(config.element_draw_type[element.type] == "svg"){
                if(!element.svg_initialised || d3.select('#' + element.svg_id).empty()){
                    let svg_id = '#dynSvgContainer';
                    defaultSVGFuncs[element.type](element, svg_id);
                    element.svg_initialised = true;
                }
                element.svgUpdate();
            }
        }
    },
    loop: function(ts, new_loop = false){
        //let start_t = window.performance.now();
        //if(!this.loop_started) return;
        this.last_frame = this.last_frame || ts;
        if(new_loop) this.last_frame = ts;
        let stage_not_done = true;
        if(!this.paused){
            this.current_animation_percent += (ts-this.last_frame) / this.animation.total_duration;
            stage_not_done = this.setProgress(this.current_animation_percent);
        }
        
        //this.drawStatic();
        if(stage_not_done){
            this.drawDynamic();
            if(this.static_draw_index == 0){
                this.drawStatic();
            }
            this.drawStaticOnTop();
            this.static_draw_index += 1;
            this.static_draw_index %= 3;
            this.last_frame = ts;
            //console.log(window.performance.now() - start_t);
        }

        if(!this.paused){
            this.reqAnimationFrame = requestAnimationFrame(this.loop.bind(this));
        }
        
    },
    animationDone: function(){
        if(this.reps_left > 0) {
            
            this.initAnimation(this.reps_left, this.include_distribution, false, true);
        }else{
            this.speed = null;
            controller.pause();
            controller.animationDone();
            this.updateDynamic(1);
            this.drawDynamic();
            this.drawStatic();
            this.drawStaticOnTop();
        }
        
    },

    setProgress: function(p){
        
        this.current_animation_percent = p;
        // this.animation.percentUpdate(this.current_animation_percent);
        let [stage, stage_percentage] = this.animation.percentUpdate(this.current_animation_percent);
        if(stage != this.current_stage){
            this.animation.startStage(stage);
            this.current_stage = stage;
        }
        
        this.updateDynamic(stage_percentage);
        
        controller.setPlaybackProgress(p);

        if(this.paused && stage_percentage != 1){
            this.drawDynamic();
            this.drawStatic();
            this.drawStaticOnTop();
        }

        return stage_percentage != 1;
        
    },
    pause: function(){
        this.paused = true;
        if(this.reqAnimationFrame){
            cancelAnimationFrame(this.reqAnimationFrame);  
            this.loop_started = false;
        }
        this.last_frame = null;
    },
    unpause: function(){
        this.paused = false;
        
        cancelAnimationFrame(this.reqAnimationFrame); 
        this.loop(window.performance.now());
        this.loop_started = true;
        
    },
    scale: function(scale_x, scale_y, PIXEL_RATIO){
        if(!this.ctx) return;
        // this.drawDynamic();
        // this.drawStatic();
        // this.ctx.scale(scale_x, scale_y);
        // this.dynamicCtx.scale(scale_x, scale_y);
        clearCtx(this.ctx);
        this.drawDynamic();
        this.drawStatic();
    },
    stopAndClear(){
        controller.pause();
        clearSvg('dynSvgContainer');
        clearSvgTextLines('popSvgContainer');
    },
    destroy(){
        if(this.reqAnimationFrame){
            cancelAnimationFrame(this.reqAnimationFrame);  
        }
        
    }
}

class visElement{
    constructor(id, type){
        this.id = id;
        this.type = type;
        this.attrs = {};
        this.svg_id = this.getUniqueId();
    }
    getUniqueId(){
        let id = this.type + '-' + this.id + "-" + Math.round(Math.random() * 100000);
        while(!(d3.select('#' + id).empty())){
            id = this.type + '-' + this.id + "-" + Math.round(Math.random() * 100000);
        }
        return id;
    }
    getAttr(attr){
        if(attr in this.attrs){
            return this.attrs[attr];
        }
    }
    setAttr(attr, val){
        this.attrs[attr] = val;
        
    }
    setAttrInit(attr, val){
        this.attrs[attr] = val;
        this.attrs['init_'+attr] = val;
    }
    draw(ctx){
        if(this.drawFunc){
            this.drawFunc(ctx);
        }else{
            defaultDrawFuncs[this.type](this, ctx);
        }
    }
    svgUpdate(){
        defaultSVGUpdates[this.type](this);
    }
}
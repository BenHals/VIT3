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
        createAnalysisMarkersFromDataset(dataset, this.options, this.areas, this.areas[`${area}display`], ds_domain, ds_range, dimensions, `${name}_analysis`, svg, is_population, this.population_dimensions == this.sample_dimensions);
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
    initSample: function(sample_id){
        console.log(sample_id);
        clearSvg('dynamicSVG');
        this.hideCI();
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
        let ci_coverage = document.querySelector('#cover-ci-text');
        if(ci_coverage){
            let distribution = [...document.querySelectorAll('.distribution')].filter((e, i) => i <= sample_id);
            let distribution_in_ci = distribution.filter((e) => e.dataset.inci == "true");
            let coverage_up_to_sample = distribution_in_ci.length / distribution.length
            ci_coverage.textContent = `CI Coverage \n = ${distribution_in_ci.length} / ${distribution.length} = ${Math.round(coverage_up_to_sample * 100) / 100}`; 
        }
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
        let pop_stat = this.population_dataset.statistics.overall.analysis[this.options.Statistic][this.options.popAnalysis];
        let get_in_ci = (dp) => {return this.module.inCI(distribution_stats, this.population_dataset.statistics, pop_stat, dp)};
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
        let sample_elements = createDistribution(distribution, this.options, this.areas, this.areas[`${area}display`], ds_domain, ds_range, dimensions, `distribution-container`, svg, false, get_in_ci, pop_stat);
        createAxis(scale, this.areas[`${area}axis`], dimensions, `${name}_axis`, svg, false)
    },

    hideGhosts: function(){
        let ghosts = document.querySelectorAll('.sample-ghost,.distribution');
        for(g of ghosts){
            g.style.display = 'none';
        }
    },
    hideCI: function(){
        let ci = document.querySelectorAll('.ci');
        for(g of ci){
            g.style.display = 'none';
        }
    },
    showCI: function(){
        let ci = document.querySelectorAll('.ci');
        for(g of ci){
            g.style.display = null;
        }
    },



    initAnimation: function(reps, include_distribution, track, inherit_speed = false){
        this.pause();
        this.reps_left = reps - 1;
        let speed = inherit_speed ? this.speed : (1 + 0.75*(reps - 1)) * (1 + 1 * include_distribution);
        this.speed = speed;
        this.include_distribution = include_distribution;

        if(this.current_sample >= this.samples.length){
            this.current_sample = 0;
            this.hideGhosts();
        }

        let self = this;
        let animation = {
            total_duration: 10000 / speed,
            start: function(){
                self.initSample(self.current_sample);
                self.current_sample++;
                // self.current_sample = (self.current_sample + 1)%(self.samples.length);
            },
            percentUpdate: function(p){
                return p >= 1;
            }
        }
        this.animation = animation;
        this.animation.start();
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
        this.current_animation_percent = 0;
        this.paused = false;
        ac_unpause();
        this.last_frame = window.performance.now();
        if(!this.loop_started) {
            this.loop(window.performance.now(), true);
            this.loop_started = true;
        }

    },
    initCIAnimation(large){
        this.showCI();
        // this.reps_left = 0;
        // let speed = 1;
        // this.include_distribution = false;
        // let animation = new Animation(`ci`);
        // ma_createCIAnimation(animation, this.population_dimensions, this.sample_dimensions, this.staticElements, this.dynamicElements, this.module, speed, this.current_sample, this.areas, large);
        // this.animation = animation;
        // this.animation.start();
        
        // [this.current_stage, this.current_animation_percent]  = this.animation.progress_time(window.performance.now());
        // if(this.last_animation_type == "ci"){
        //     this.setProgress(1);
        // }
        // this.last_animation_type = "ci";
        // this.paused = false;
        // ac_unpause();
        // this.last_frame = window.performance.now();
        // if(!this.loop_started) {
        //     this.loop(window.performance.now());
        //     this.loop_started = true;
        // }
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

    testSections: function(){
        for(let i in this.areas){
            this.ctx.fillStyle = "rgb("+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+")";
            this.ctx.fillRect(parseInt(this.areas[i].left), this.areas[i].top, this.areas[i].width, this.areas[i].height); 
        }
    },

    loop: function(ts, new_loop = false){
        this.last_frame = this.last_frame || ts;
        if(new_loop) this.last_frame = ts;
        let stage_not_done = true;
        if(!this.paused){
            this.current_animation_percent += (ts-this.last_frame) / this.animation.total_duration;
            console.log(this.current_animation_percent);
            stage_not_done = this.setProgress(this.current_animation_percent);
            
        }
        
        //this.drawStatic();
        if(!stage_not_done){
           this.animationDone();
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
        }
        
    },

    setProgress: function(p){
        
        this.current_animation_percent = p;
        let stage_percentage = this.animation.percentUpdate(this.current_animation_percent);
        
        controller.setPlaybackProgress(p);

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
        this.loop(window.performance.now(), true);
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
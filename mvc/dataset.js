function createDataset(data, dimensions, statistics_generator){
    let dataset = {};
    dataset.all = [];
    dimensions.forEach(dim => {
        dataset[dim.name] = {};
        let own_factors = dim.factors;
        own_factors.forEach((own_fac)=>{
            dataset[dim.name]["own"+own_fac] = {};
            dataset[dim.name]["own"+own_fac].all = [];
            dimensions.forEach(dimSec => {
                if(dim == dimSec) return;
                dataset[dim.name]["own"+own_fac][dimSec.name] = {};
                let sec_factors = dimSec.factors;
                sec_factors.forEach((sec_fac)=>{
                    dataset[dim.name]["own"+own_fac][dimSec.name][sec_fac] = {};
                    dataset[dim.name]["own"+own_fac][dimSec.name][sec_fac].all = [];
                });
            });
        });
        dimensions.forEach(dimSec => {
            if(dim == dimSec) return;
            dataset[dim.name][dimSec.name] = {};
            let sec_factors = dimSec.factors;
            sec_factors.forEach((sec_fac)=>{
                dataset[dim.name][dimSec.name][sec_fac] = {};
                dataset[dim.name][dimSec.name][sec_fac].all = [];
            });
        });
    });
    for(let r = 0; r < data.length; r++){
        let row = data[r];
        dataset.all.push(row);
        dimensions.forEach(dim => {
            let row_value_own = row[dim.name];
            let row_fac_own = dim.type == 'categoric' ? row_value_own : "";
            //dataset[dim.name].all.push(row);
            let own_factors = dim.factors;
            own_factors.forEach((own_fac)=>{
                if(row_fac_own != own_fac) return;
                dataset[dim.name]["own"+own_fac].all.push(row);
                dimensions.forEach(dimSec => {
                    if(dim == dimSec) return;
                    let row_value_sec = row[dimSec.name];
                    let row_fac_sec = dimSec.type == 'categoric' ? row_value_sec : "";
                    //dataset[dim.name]["own"+own_fac][dimSec.name].all.push(row);
                    let sec_factors = dimSec.factors;
                    sec_factors.forEach((sec_fac)=>{
                        if(row_fac_sec != sec_fac) return;
                        dataset[dim.name]["own"+own_fac][dimSec.name][sec_fac].all.push(row);
                    });
                });
            });
            dimensions.forEach(dimSec => {
                if(dim == dimSec) return;
                let row_value_sec = row[dimSec.name];
                let row_fac_sec = dimSec.type == 'categoric' ? row_value_sec : "";
                //dataset[dim.name][dimSec.name].all.push(row);
                let sec_factors = dimSec.factors;
                sec_factors.forEach((sec_fac)=>{
                    if(row_fac_sec != sec_fac) return;
                    dataset[dim.name][dimSec.name][sec_fac].all.push(row);
                });
            });
        });
    }

    dataset.statistics = runStatGens(dataset.all, statistics_generator.overall);
    dimensions.forEach((dim, i) => {
        let own_factors = dim.factors;
        own_factors.forEach((own_fac)=>{
            dataset[dim.name]["own"+own_fac].statistics = runStatGens(dataset[dim.name]["own"+own_fac].all, statistics_generator['fac'+(i+1)]);
            dimensions.forEach(dimSec => {
                if(dim == dimSec) return;
                let sec_factors = dimSec.factors;
                sec_factors.forEach((sec_fac)=>{
                    dataset[dim.name]["own"+own_fac][dimSec.name][sec_fac].statistics = runStatGens(dataset[dim.name]["own"+own_fac][dimSec.name][sec_fac].all, statistics_generator['both']);
                });
            });
        });
        dimensions.forEach(dimSec => {
            if(dim == dimSec) return;
            let sec_factors = dimSec.factors;
            sec_factors.forEach((sec_fac)=>{
                dataset[dim.name][dimSec.name][sec_fac].statistics = runStatGens(dataset[dim.name][dimSec.name][sec_fac].all, statistics_generator['fac' + (2-i)]);
            });
        });
    });
    return dataset;
}

function createDatasetMinimal(data, dimensions, statistics_generator, statanalysis_generator){
    let dataset = {};
    dataset.all = [];
    for(let r = 0; r < data.length; r++){
        let row = data[r];
        dataset.all.push(row);
    }

    dataset.statistics = {};
    dataset.statistics.overall = {};
    dataset.statistics.factor_1 = {};
    dataset.statistics.factor_2 = {};
    dataset.statistics.overall.point_stats = {};
    dataset.statistics.overall.point_stats = runStatGens(dataset.all, dataset.all, dataset.all, statistics_generator.overall);
    dataset.statistics.both = {};
    dimensions.forEach((dim, i) => {
        let own_factors = dim.factors;
        own_factors.forEach((own_fac)=>{
            let filter_data = dataset.all.filter(el => own_fac == "" ? true : el[dim.name] == own_fac);
            dataset.statistics[`factor_${i+1}`][own_fac] = {};
            dataset.statistics[`factor_${i+1}`][own_fac].point_stats = runStatGens(filter_data, dataset.all, dataset.all, statistics_generator[`fac${i+1}`]);
            dimensions.forEach(dimSec => {
                if(dim == dimSec) return;
                let sec_factors = dimSec.factors;
                sec_factors.forEach((sec_fac)=>{
                    if (!dataset.statistics.both[sec_fac]) dataset.statistics.both[sec_fac] = {};
                    let combo_data = filter_data.filter(el => sec_fac == "" ? true : el[dimSec.name] == sec_fac);
                    dataset.statistics.both[sec_fac][own_fac] = {};
                    dataset.statistics.both[sec_fac][own_fac].point_stats = runStatGens(combo_data, filter_data, dataset.all, statistics_generator['both']);
                });
            });
        });
    });

    dataset.statistics.overall.analysis = {};
    for(stat in dataset.statistics.overall.point_stats){
        dataset.statistics.overall.analysis[`${stat}`] = runStatAnalysisGens(dataset.all, dataset.all, dataset.all, dataset.statistics.overall, dataset.statistics, stat, statanalysis_generator.overall);
    }
    dimensions.forEach((dim, i) => {
        let own_factors = dim.factors;
        own_factors.forEach((own_fac)=>{
            let filter_data = dataset.all.filter(el => own_fac == "" ? true : el[dim.name] == own_fac);
            dataset.statistics[`factor_${i+1}`][own_fac].analysis = {};
            for(stat in dataset.statistics[`factor_${i+1}`][own_fac].point_stats){
                dataset.statistics[`factor_${i+1}`][own_fac].analysis[`${stat}`] = runStatAnalysisGens(filter_data, dataset.all, dataset.all, dataset.statistics[`factor_${i+1}`][own_fac], dataset.statistics, stat, statanalysis_generator[`fac${i+1}`]);
            }
            dimensions.forEach(dimSec => {
                if(dim == dimSec) return;
                let sec_factors = dimSec.factors;
                sec_factors.forEach((sec_fac)=>{
                    let combo_data = filter_data.filter(el => sec_fac == "" ? true : el[dimSec.name] == sec_fac);
                    dataset.statistics.both[sec_fac][own_fac].analysis = {};
                    for(stat in dataset.statistics.both[sec_fac][own_fac].point_stats){
                        dataset.statistics.both[sec_fac][own_fac].analysis[`${stat}`] = runStatAnalysisGens(combo_data, filter_data, dataset.all, dataset.statistics.both[sec_fac][own_fac], dataset.statistics, stat, statanalysis_generator['both']);
                    }
                });
            });
        });
    });
    return dataset;
}


function runStatGens(datapoints, group_datapoints, all_datapoints, functions){
    let stats = {};
    for(let f in functions){
        stats[functions[f][0]] = functions[f][1](datapoints, group_datapoints, all_datapoints);
    }
    return stats;
}
function runStatAnalysisGens(datapoints, group_datapoints, all_datapoints, group_stats, overall_stats, stat_name, functions){
    let stats = {};
    for(let f in functions){
        stats[functions[f][0]] = functions[f][1](datapoints, group_datapoints, all_datapoints, group_stats, overall_stats, stat_name);
    }
    return stats;
}

function pointValueAnalysis(stat_name){
    return [stat_name, function(dp, group, total, group_stats, overall_stats, stat_name){
        return group_stats.point_stats[stat_name];
    }];
}
function stdAnalysis(stat_name, dim){
    return [stat_name, function(dp, group, total, group_stats, overall_stats, stat_name){
        return d3.deviation(dp.map(e => e[dim]));
        // return group_stats.point_stats[stat_name];
    }];
}
function ciAnalysis(stat_name, dim){
    return [stat_name, function(dp, group, total, group_stats, overall_stats, stat_name){
        let se =  d3.deviation(dp.map(e => e[dim])) / Math.sqrt(dp.length);
        let stat =  group_stats.point_stats[stat_name];
        let multiplier = 1.96;
        let ci_range = [stat - (multiplier * se), stat, stat + (multiplier * se)];
        return ci_range;
        // return group_stats.point_stats[stat_name];
    }];
}
function deviationAnalysis(stat_name, dim_name){
    return [stat_name, function(dp, group, total, group_stats, overall_stats, stat_name){
        const overall_stat = overall_stats.overall.point_stats[stat_name];
        const self_stat = group_stats.point_stats[stat_name];
        return Math.abs(self_stat - overall_stat);
    }];
}
function avDevAnalysis(stat_name, dim_name, factors){
    return [stat_name, function(dp, group, total, group_stats, overall_stats, stat_name){
        const overall_stat = overall_stats.overall.point_stats[stat_name];
        let avg = 0;
        for(let f = 0; f < factors.length; f++){
            const factor_stat = overall_stats.factor_2[factors[f]].point_stats[stat_name];
            avg += Math.abs(factor_stat - overall_stat);
        }
        return avg / factors.length;
    }];
}
function differenceAnalysis(stat_name, dim_name, factors){
    return [stat_name, function(dp, group, total, group_stats, overall_stats, stat_name){
        if(factors.length < 2) return 0;
        const factor_1_stat = overall_stats.factor_2[factors[0]].point_stats[stat_name];
        const factor_2_stat = overall_stats.factor_2[factors[1]].point_stats[stat_name];
        return factor_2_stat - factor_1_stat;
    }];
}

function fStatAnalysis(stat_name, dim_name, factors){
    return avDevAnalysis(stat_name, dim_name, factors);
}

function meanGen(stat_name, dim_name){
    return [stat_name, function(dp, group, total){
        dp = dp || [];
        if(dp.length < 1) return 0;
        let sum = dp.reduce((a, c)=>{return a+parseFloat(c[dim_name]) || 0}, 0);
        let avg = sum / dp.length;
        return isNaN(avg) ? 0 : avg;
    }];
}
function stdGen(stat_name, dim_name, focus){
    return [stat_name, function(dp, group, total){
        dp = dp || [];
        if(dp.length < 1) return 0;
        let values = dp.map(function(c){
            let val = c[dim_name];

            // Account for categorical, A categorical value is a category name so we convert to 0 or 1.
            if(isNaN(val)){
                val = val == focus ? 1 : 0;
            }
            return val;
        });
        let std = d3.deviation(values);
        return isNaN(std) ? 0 : std;
    }];
}
function medianGen(stat_name, dim_name){
    return [stat_name, function(dp, group, total){
        if (dp.length < 1) return 0;
        let sorted = dp.sort((a, b)=> a[dim_name] - b[dim_name]);
        let mid_ceil = sorted[Math.floor((dp.length - 1) / 2)];
        let mid_floor = sorted[Math.ceil((dp.length - 1) / 2)];
        if(mid_ceil == undefined || mid_floor == undefined){
            console.log(dp);
            return 0;
        }
        
        return (mid_ceil[dim_name] + mid_floor[dim_name])/2;
    }];
}
function maxGen(stat_name, dim_name, proportion){
    return [stat_name, function(dp, group, total){
        if(proportion) return 1;
        if (dp.length < 1) return 0;
        let sorted = dp.sort((a, b)=> a[dim_name] - b[dim_name]);
        return (sorted[sorted.length - 1][dim_name]);
    }];
}
function minGen(stat_name, dim_name, proportion){
    return [stat_name, function(dp, group, total){
        if(proportion) return 0;
        if (dp.length < 1) return 0;
        let sorted = dp.sort((a, b)=> a[dim_name] - b[dim_name]);
        return (sorted[0][dim_name]);
    }];
}
function lqGen(stat_name, dim_name){
    return [stat_name, function(dp, group, total){
        if (dp.length < 1) return 0;
        let sorted = dp.sort((a, b)=> a[dim_name] - b[dim_name]);
        let mid_ceil = sorted[Math.floor((dp.length - 1) / 4)];
        let mid_floor = sorted[Math.ceil((dp.length - 1) / 4)];
        if(mid_ceil == undefined || mid_floor == undefined){
            console.log(dp);
            return 0;
        }
            
        return (mid_ceil[dim_name] + mid_floor[dim_name])/2;
    }];
}
function uqGen(stat_name, dim_name){
    return [stat_name, function(dp, group, total){
        if (dp.length < 1) return 0;
        let sorted = dp.sort((a, b)=> a[dim_name] - b[dim_name]);
        let mid_ceil = sorted[Math.floor(((dp.length - 1) / 4) * 3)];
        let mid_floor = sorted[Math.ceil(((dp.length - 1) / 4) * 3)];
        if(mid_ceil == undefined || mid_floor == undefined){
            console.log(dp);
            return 0;
        }
            
        return (mid_ceil[dim_name] + mid_floor[dim_name])/2;
    }];
}
function propGen(stat_name){
    return [stat_name, function(dp, group, total){
        if(total == 0) return 0;
        return dp.length / group.length || 0;
    }];
}
function focusPropGen(stat_name, dim, focus){
    return [stat_name, function(dp, group, total){
        if(total == 0) return 0;
        return dp.filter(e => e[dim] == focus).length / dp.length || 0;
    }];
}

function slopeGen(stat_name, dim_name, dim_name2){
    return [stat_name, function(dp, group, total){
        let mean_x = meanGen('', dim_name)[1](dp);
        let mean_y = meanGen('', dim_name2)[1](dp);
        let covar = dp.reduce((a, c)=> {
            let x = (c[dim_name] - mean_x);
            let y = (c[dim_name2] - mean_y);
            return a + (x*y)}, 0);
        let x_var = dp.reduce((a, c)=> a + ((c[dim_name] - mean_x)*(c[dim_name] - mean_x)), 0);
        let slope = covar / x_var;
        return slope;
    }];
}

function interceptGen(stat_name, dim_name, dim_name2){
    return [stat_name, function(dp, group, total){
        let mean_x = meanGen('', dim_name)[1](dp);
        let mean_y = meanGen('', dim_name2)[1](dp);
        let slope = slopeGen(stat_name, dim_name, dim_name2)[1](dp);
        let intercept = mean_y - slope*mean_x;
        return intercept;
    }];
}
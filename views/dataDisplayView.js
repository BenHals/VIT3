let dd_showing = false;
function generateDataDisplay(dataset){
    let base_html = `
    <div id="t-container">
        <button type="button" class="btn btn-default hidden" aria-label="hide" onclick="dd_toggle()">
            <span id="hideDD" class="glyphicon glyphicon-menu-left" aria-hidden="true"></span>
            <span id="showDD" class="glyphicon glyphicon-menu-right" aria-hidden="true"></span>
        </button>
        <div class="table-responsive">
            <table id='prunedTable' class = 'table'>
                <thead>
                    <tr id='sampleNum'></tr>
                    <tr id='tableHeadings'></tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>
    </div>
    <canvas id="ddaug" width="0" height="0" style="position:absolute; pointer-events:none">
    </canvas>`;
    return [base_html, [dd_populateInit.bind(this, dataset, model.dimensions, model.getSampleDimensions()), dd_populateStatistics.bind(this, dataset)]];
}

// ********** Data Display Events **********
function dd_toggle(){
    dd_showing ? dd_hide() : dd_show();
    controller.ddResized(document.querySelector("#dataDisplay").clientWidth);
}
// ********** Data Display Updates **********
function dd_populateInit(dataset, dimensions, sample_dimensions, no_sample){
    document.querySelector('#dataDisplay button').classList.remove('hidden');
    document.querySelector('#showDD').style.display = null;
    dd_showing = true;
    document.querySelector('#sampleNum').insertAdjacentHTML('beforeend', `<th colspan=${dimensions.length}>Population</th>`);
    document.querySelector('#sampleNum').insertAdjacentHTML('beforeend', `<th colspan=${dimensions.length}>Sample</th>`);
    for(let c = 0; c < dimensions.length; c++){
        document.querySelector('#tableHeadings').insertAdjacentHTML('beforeend', `<th>${dimensions[c].name}</th>`);
    }
    for(let c = 0; c < sample_dimensions.length; c++){
        document.querySelector('#tableHeadings').insertAdjacentHTML('beforeend', `<th>${sample_dimensions[c].name}</th>`);
    }
    dd_populateRows(dataset, dimensions, sample_dimensions);
    dd_updateDatapoints(dataset, dimensions, sample_dimensions, true);
    if(!no_sample) dd_updateDatapoints(dataset, dimensions, sample_dimensions, false);
    dd_toggle();
}

function dd_populateRows(dataset, dimensions, sample_dimensions){
    for(let r in dataset.all){
        //if(+r > 30) break;
        let row = dataset.all[r];
        let tr = document.createElement('tr');
        tr.setAttribute('data-id', r);
        document.querySelector('#prunedTable tbody').insertAdjacentElement('beforeend', tr);
        for(let c = 0; c < dimensions.length; c++){
            let dim_name = dimensions[c].name;
            // var td = $(`<td>${row[dim_name]}</td>`);
            // tr.insertAdjacentHTML('beforeend', td);
            let td = document.createElement('td');
            if(dimensions[c].type == 'categoric'){
                var colorIndex = dimensions[c].factors.indexOf(row[dim_name]);
                td.style["color"] = c == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex];
            }   
            td.textContent = row[dim_name];
            tr.insertAdjacentElement('beforeend', td);
        }
        for(let c = 0; c < sample_dimensions.length; c++){
            let dim_name  = sample_dimensions[c];
            let td = document.createElement('td');
            tr.insertAdjacentElement('beforeend', td);
            if(sample_dimensions[c].type == 'categoric'){
                var colorIndex = sample_dimensions[c].factors.indexOf(row[dim_name]);
                td.textContent = row[dim_name];
                td.style["color"] = c == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex];
            } 
        }
    }
}

function dd_updateDatapoints(dataset, dimensions, sample_dimensions, isPop){
    let rows = document.querySelectorAll("#prunedTable > tbody > tr");
    let start_td = isPop ? 0 : dimensions.length;
    let end_td = isPop ? dimensions.length : dimensions.length + sample_dimensions.length;
    for([r, row] of [...rows].entries()){
        let td_elements = row.children;
        for([d, el] of [...td_elements].entries()){
            if(d < start_td || d >= end_td) continue;
            let dim_index = d - start_td;
            let row_value = r >= dataset.all.length ? "" : dataset.all[r][sample_dimensions[dim_index].name];
            el.textContent = row_value;
            if(sample_dimensions[dim_index].type == 'categoric'){
                let colorIndex = sample_dimensions[dim_index].factors.indexOf(row_value);
                el.style.color = dim_index == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex];
            } 
        }
    }
}
function dd_clearDatapoints(dataset, dimensions, sample_dimensions, isPop){
    let augCanvas = document.getElementById('ddaug');
    let augCtx = augCanvas.getContext('2d');
    let canvasBox = augCanvas.getBoundingClientRect();
    augCtx.clearRect(0, 0, canvasBox.width, canvasBox.height);
    let rows = document.querySelectorAll("#prunedTable > tbody > tr");
    let start_td = isPop ? 0 : dimensions.length;
    let end_td = isPop ? dimensions.length : dimensions.length + sample_dimensions.length;
    for([r, row] of [...rows].entries()){
        let td_elements = row.children;
        for([d, el] of [...td_elements].entries()){
            if(d < start_td || d >= end_td) return;
            let dim_index = d - start_td;
            let fs = el.style['font-size'];
            let ofs = el.getAttribute('data-ofont');
            el.style['font-weight'] =  'Normal';
            el.style['font-size'] = ofs;
            let row_value = dataset.all[r][sample_dimensions[dim_index].name];
            if(sample_dimensions[0].type == 'categoric'){
                let colorIndex = sample_dimensions[0].factors.indexOf(row_value);
                el.style["color"] = 0 == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex];
            }else{
                el.style["color"] =  'black';
            }

            
            
            row_value = "";
            el.innerHTML = row_value;
            

        }
    }
}
function dd_updateSingleDatapoints(dataset, dimensions, sample_dimensions, sample_index, display_index, isPop){
    // let rows = $("#prunedTable > tbody > tr");
    // let start_td = isPop ? 0 : dimensions.length;
    // let end_td = isPop ? dimensions.length : dimensions.length + sample_dimensions.length;
    // let sample_point = dataset.permuted[display_index];
    // let pop_id = sample_point['id'];
    // let pop_index = 0;
    // for(let d = 0; d < dataset.all.length; d++){
    //     if(dataset.all[d]['id'] == pop_id){
    //         pop_index = d;
    //         break;
    //     }
    // }
    // let augCanvas = document.getElementById('ddaug');
    // let augCtx = augCanvas.getContext('2d');
    // let canvasBox = augCanvas.getBoundingClientRect();
    // let popBox = null;
    // let box = null;
    // rows.each(function(r){
    //     //

    //     let td_elements = $(this).children();
    //     td_elements.each(function(d){
    //         let fs = $(this).css('font-size');
    //         let ofs = $(this).attr('data-ofont');
            
    //         if(r == pop_index && d == 0){
    //             $(this).css("color", '#f5f5f5');
    //             //$(this).css('font-weight', 'Bold');
    //             //$(this).attr('data-ofont', ofs ? ofs : fs);
    //             //$(this).css('font-size', ofs);
    //             //$(this).css('font-size', "+=5");
    //             popBox = $(this)[0].getBoundingClientRect();

    //             augCtx.font = `${parseInt(fs) + 5}px sans-serif`;
    //             augCtx.textAlign = 'center';
    //             augCtx.textBaseline = 'middle';
    //             augCtx.fillStyle = 'red';
    //             augCtx.fillText(dataset.permuted[display_index][sample_dimensions[0].name], (popBox.left + popBox.right)/2 - canvasBox.left, (popBox.top + popBox.bottom) / 2 - canvasBox.top);
    //         }else{
    //             let dim_index = d % (end_td - start_td);
    //             let row_value = dataset.permuted[r][sample_dimensions[dim_index].name];
    //             $(this).css('font-weight', 'Normal');
    //             $(this).css('font-size', ofs);
    //             if(sample_dimensions[0].type == 'categoric'){
    //                 let colorIndex = sample_dimensions[0].factors.indexOf(row_value);
    //                 $(this).css("color", 0 == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex]);
    //             }else{
    //                 $(this).css("color", 'black');
    //             }
    //         }
    //         if(r <= display_index){
    //             if(d < start_td || d >= end_td) return;
    //             let dim_index = d - start_td;
    //             let row_value = dataset.permuted[r][sample_dimensions[dim_index].name];
    //             $(this).html(row_value);
    //             //box = $(this)[0].getBoundingClientRect();

    //             if(r == display_index){
    //                 //$(this).css("color", 'white');
    //                 // $(this).css('font-weight', 'Bold');
    //                 // $(this).attr('data-ofont', ofs ? ofs : fs);
    //                 // $(this).css('font-size', ofs);
    //                 // $(this).css('font-size', "+=5");
    //                 $(this).css("color", '#f5f5f5');
    //                 //$(this).css('font-weight', 'Bold');
    //                 //$(this).attr('data-ofont', ofs ? ofs : fs);
    //                 //$(this).css('font-size', ofs);
    //                 //$(this).css('font-size', "+=5");
    //                 box = $(this)[0].getBoundingClientRect();
    
    //                 augCtx.font = `${parseInt(fs) + 5}px sans-serif`;
    //                 augCtx.textAlign = 'center';
    //                 augCtx.textBaseline = 'middle';
    //                 augCtx.fillStyle = 'red';
    //                 augCtx.fillText(dataset.permuted[display_index][sample_dimensions[dim_index].name], (box.left + box.right)/2 - canvasBox.left, (box.top + box.bottom) / 2 - canvasBox.top);
    //             }else{
    //                 $(this).css('font-weight', 'Normal');
    //                 $(this).css('font-size', ofs);
    //                 if(sample_dimensions[dim_index].type == 'categoric'){
    //                     let colorIndex = sample_dimensions[dim_index].factors.indexOf(row_value);
    //                     $(this).css("color", dim_index == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex]);
    //                 }else{
    //                     $(this).css("color", 'black');
    //                 }
    //             }

    //         }

    //     })
    // });
    
    // augCtx.fillStyle = 'red';
    // augCtx.strokeStyle = 'red';
    // let x1 = popBox.right - 10 - canvasBox.left;
    // let x2 = box.left + 10 - canvasBox.left;
    // let y1 = (popBox.top + popBox.bottom) / 2 - canvasBox.top;
    // let y2 = (box.top + box.bottom) / 2  - canvasBox.top;
    // let direction = (x2 - x1) > 0 ? 1 : -1;
    // let arrow_head_x = x2 - direction * 5;
    // augCtx.beginPath();
    // augCtx.moveTo(x1, y1);
    // augCtx.lineTo(x2, y2);
    // // augCtx.lineTo(arrow_head_x, y2 + direction * 3);
    // // augCtx.moveTo(x2, y2);
    // // augCtx.lineTo(arrow_head_x, y2 - direction * 3);
    // augCtx.closePath();
    // augCtx.stroke();

}
function dd_linkSingleDatapoint(dataset, dimensions, sample_dimensions, sample_index, display_index, isPop){
    // let rows = $("#prunedTable > tbody > tr");
    // let start_td = isPop ? 0 : dimensions.length;
    // let end_td = isPop ? dimensions.length : dimensions.length + sample_dimensions.length;
    // let augCanvas = document.getElementById('ddaug');
    // let augCtx = augCanvas.getContext('2d');
    // let canvasBox = augCanvas.getBoundingClientRect();
    // let popBox = null;
    // let boxs_to = []
    // rows.each(function(r){
    //     let td_elements = $(this).children();
    //     let line_drawn = false;
    //     td_elements.each(function(d){
    //         let fs = $(this).css('font-size');
    //         let ofs = $(this).attr('data-ofont');
    //         if(r == display_index && d == 0){
    //             $(this).css("color", '#f5f5f5');
    //             popBox = $(this)[0].getBoundingClientRect();
    //             augCtx.font = `${parseInt(fs) + 5}px sans-serif`;
    //             augCtx.textAlign = 'center';
    //             augCtx.textBaseline = 'middle';
    //             augCtx.fillStyle = 'red';
    //             augCtx.fillText(dataset.all[display_index][sample_dimensions[0].name], (popBox.left + popBox.right)/2 - canvasBox.left, (popBox.top + popBox.bottom) / 2 - canvasBox.top);
    //         }else{
    //             let dim_index = d % (end_td - start_td);
    //             let row_value = dataset.permuted[r][sample_dimensions[dim_index].name];
    //             $(this).css('font-weight', 'Normal');
    //             $(this).css('font-size', ofs);
    //             if(sample_dimensions[0].type == 'categoric'){
    //                 let colorIndex = sample_dimensions[0].factors.indexOf(row_value);
    //                 $(this).css("color", 0 == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex]);
    //             }else{
    //                 $(this).css("color", 'black');
    //             }
    //         }
    //         if(d < start_td || d >= end_td) return;
    //         let dim_index = d - start_td;
    //         let row_value = dataset.permuted[r][sample_dimensions[dim_index].name];
    //         $(this).html(row_value);
    //         if(dataset.permuted[r].id == dataset.all[display_index].id){
    //             $(this).css("color", '#f5f5f5');
    //             box = $(this)[0].getBoundingClientRect();
    //             augCtx.font = `${parseInt(fs) + 5}px sans-serif`;
    //             augCtx.textAlign = 'center';
    //             augCtx.textBaseline = 'middle';
    //             augCtx.fillStyle = 'red';
    //             augCtx.fillText(dataset.all[display_index][sample_dimensions[dim_index].name], (box.left + box.right)/2 - canvasBox.left, (box.top + box.bottom) / 2 - canvasBox.top);
    //             if(!line_drawn){
    //                 boxs_to.push(box);
    //                 line_drawn = true;
    //             }
    //         }else{
    //             $(this).css('font-weight', 'Normal');
    //             $(this).css('font-size', ofs);
    //             if(sample_dimensions[dim_index].type == 'categoric'){
    //                 let colorIndex = sample_dimensions[dim_index].factors.indexOf(row_value);
    //                 $(this).css("color", dim_index == 0 ? config.proportionColorsList[colorIndex] : config.groupColorsList[colorIndex]);
    //             }else{
    //                 $(this).css("color", 'black');
    //             }
    //         }

    //     })
    // });
    
    // for(let b = 0; b < boxs_to.length; b++){
    //     let box = boxs_to[b];
    //     augCtx.fillStyle = 'red';
    //     augCtx.strokeStyle = 'red';
    //     let x1 = popBox.right - 10 - canvasBox.left;
    //     let x2 = box.left + 10 - canvasBox.left;
    //     let y1 = (popBox.top + popBox.bottom) / 2 - canvasBox.top;
    //     let y2 = (box.top + box.bottom) / 2  - canvasBox.top;
    //     let direction = (x2 - x1) > 0 ? 1 : -1;
    //     let arrow_head_x = x2 - direction * 5;
    //     augCtx.beginPath();
    //     augCtx.moveTo(x1, y1);
    //     augCtx.lineTo(x2, y2);
    //     // augCtx.lineTo(arrow_head_x, y2 + direction * 3);
    //     // augCtx.moveTo(x2, y2);
    //     // augCtx.lineTo(arrow_head_x, y2 - direction * 3);
    //     augCtx.closePath();
    //     augCtx.stroke();
    // }


}

function dd_populateStatistics(dataset){
    // $('#dataDisplay').insertAdjacentHTML('beforeend', "<div id='popStats' class='panel panel-default'><div class='panel-heading'><p style='font-weight:bold'>Statistics</p></div></div>")
    // for(var s in prunedData.statistics.overall){
    //     var stat = prunedData.statistics.overall[s]
    //     if(!isNaN(+stat)) stat = Math.round(+stat * 100)/100;
    //     $('#popStats').insertAdjacentHTML('beforeend', `<p class='list-group-item'>${s} : ${stat}</p>`);
    // }
}

function dd_show(){
    document.querySelector("#prunedTable").style.display = null;
    document.querySelector("#hideDD").style.display = null;
    document.querySelector("#ddaug").style.display = null;
    document.querySelector("#ddaug").setAttribute('width', document.querySelector("#t-container").getAttribute('width'));
    document.querySelector("#ddaug").setAttribute('height', document.querySelector("#t-container").getAttribute('height'));
    document.querySelector("#showDD").style.display = 'none';
    dd_showing = true;
}

function dd_hide(){
    document.querySelector("#prunedTable").style.display = 'none';
    document.querySelector("#hideDD").style.display = 'none';
    document.querySelector("#ddaug").style.display = 'none';
    document.querySelector("#showDD").style.display = null;

    dd_showing = false;
}
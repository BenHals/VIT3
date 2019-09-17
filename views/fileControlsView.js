const use_var_dropdown = true;

function generateFileOptionsHTML(module){
return `
        <div id="fileOptions">
            <button type="button" class="btn btn-primary btn-block" aria-label="Back" onclick="fc_gotoHome('Home')">
                <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
                Back to Main Menu
            </button>
            <div id = "moduleName" class = "text-center h1">${module}</div>
            <label class = "btn btn-primary btn-block local-file-button"> Choose a local file...
                <input id = "localFile" type = "file" value = "Pick a local file" onchange = "fc_localFile()">
            </label>
            <div class="input-group btn-block">
            <input id="urlInputField" type="text" class="form-control" placeholder="Data from URL...">
            <span class="input-group-btn">
                <button class="btn btn-secondary" type="button" onclick="fc_loadFromURL()">Go!</button>
            </span>
            </div>
            <div class="btn-group btn-block">
                <button type="button" id="presetDropdownButton" class="btn btn-primary dropdown-toggle btn-block" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Use an Example file... <span class="caret"></span>
                </button>
                <ul id= "presetDropdown" class="dropdown-menu" style = "display: none">
                </ul>
            </div>


            <div id = "selectedFileLabel" class = "well invisible"></div>
            <div id="variablePanel" class="panel panel-default invisible">
            <div id="variableSelectHeader" class="panel-heading">
                <h3 class="panel-title">Variables</h3>
            </div>
            <select id="variableSelectM" class="panel-body selectpicker varselect" multiple='multiple'></select>
            <select id="variableSelect" class="panel-body selectpicker varselect" ${use_var_dropdown ? "" : "multiple='multiple'"}>
            </select>
            ${!use_var_dropdown ? "" : `<select id="variableSelect2" class="panel-body selectpicker varselect" ${use_var_dropdown ? "" : "multiple='multiple'"}>
            </select>`}
            </div>
            <div id="var-error" class="alert alert-danger" style="display:none;">
                <strong>Success!</strong> You should <a href="#" class="alert-link">read this message</a>.
            </div>

          
            <div id="focusPanel" class="panel panel-default invisible">
            <div id="focusSelectHeader" class="panel-heading">
                <h3 class="panel-title">Category to focus on</h3>
            </div>
            <select id="focusSelect" class="panel-body selectpicker">
            </select>
            </div>
            <button id = "sampleButton" class = "btn btn-primary btn-block" onclick="fc_sampleButtonClicked()">Analyse</button>
        </div>`;
}

function generateFileControls(module_name){

    // Returns the html for the controls, and functions to populate fields.
    let generator = generateFileOptionsHTML;
    return [generator(module_name), [populateExampleFiles]];
}

function generateExampleFilesHTML(example_files){
    let html = ``;
    for (let f in example_files){
        let filename = example_files[f];
        html += `<li class="list-group-item exampleItems">${filename}</li>`;
    }
    return html;
}

function generateColumnsHTML(columns, selected, selected_index = 0, add_none = true){
    let html = ``;
    if(add_none){
        html += (`<option class="list-group-item" value="None">None</option>`);
    }
    for(var c in columns){
        let letter = columns[c][1].slice(0, 1);
        // let is_selected = $.inArray(columns[c][0], selected.slice(selected_index)) != -1;
        let is_selected = selected.slice(selected_index).includes(columns[c][0]);
        if(use_var_dropdown){
            is_selected = columns[c][0] == selected[selected_index];
        }
        html += (`<option class="list-group-item" value="${columns[c][0]}" ${ is_selected ? "selected" : ""}>${columns[c][0]} (${letter})</option>`);
    }
    return html;
}

function generateFocusHTML(factors, focus){
    let html = ``;
    for(var f in factors){
        html += (`<option class="list-group-item" ${focus == factors[f] ? "selected='selected'" : ""}>${factors[f]}</option>`);
    }
    return html;
}

// ********** File Control Events **********
function fc_gotoHome(module_name){
    controller.gotoHome(module_name);
}

function fc_localFile(){
    let file_select = document.querySelector('#localFile');
    let file = file_select.files[0];
    if(file){
        controller.localFileSelected(file);
    }
}

function fc_loadFromURL(){
    let url_input = document.querySelector('#urlInputField');
    let url = url_input.value;
    if(url){
        controller.urlFileSelected(url);
    }
}

document.addEventListener('click', function(e){
    if (!e.target.classList.contains('exampleItems')) return;
    var data = e.target.textContent;
    controller.exampleFileSelected(data);
    document.querySelector('#presetDropdown').style.display = document.querySelector('#presetDropdown').style.display == "none" ? 'block' : 'none';
});
document.addEventListener('click', function(e){
    if (e.target.id != 'presetDropdownButton') return;

    document.querySelector('#presetDropdown').style.display = document.querySelector('#presetDropdown').style.display == "none" ? 'block' : 'none';
});
// $(document).on('click', '.exampleItems', function(){
//     var data = this.innerText;
//     controller.exampleFileSelected(data);
// });
document.addEventListener('change', function(e){
    if (!e.target.classList.contains('varselect')) return;
    let alert = document.querySelector('.varAlert')
    if (alert) alert.remove();
    // $('.varAlert').remove();
    //$('#focusPanel').addClass('invisible');
    document.querySelector('#focusPanel').style.display = 'none';
    // $('#focusPanel').hide();
    controller.columnSelected(e);
});
// $(document).on('change', '.varselect', function(e){
//     $('.varAlert').remove();
//     //$('#focusPanel').addClass('invisible');
//     $('#focusPanel').hide();
//     controller.columnSelected(e);
// });
document.addEventListener('change', function(e){
    if (e.target.id != 'focusSelect') return;
    controller.focusSelected(e);
});
// $(document).on('change', '#focusSelect', function(e){
//     controller.focusSelected(e);
// });

function fc_selectedFileClicked(){
    return ;
}

function fc_sampleButtonClicked(){
    controller.gotoOption();
}

// ********** File Control Updates **********
async function populateExampleFiles(){
    let example_files = await model.getExampleFileNames();
    let example_files_html = generateExampleFilesHTML(example_files);
    document.querySelector("#presetDropdown").innerHTML = example_files_html;
    // $("#presetDropdown").html(example_files_html);
    document.querySelector('#var-error').style.display = 'none';
    // $('#var-error').hide();
}

function fc_populateColumnSelect(columns, selected){
    document.querySelector('#variablePanel').classList.remove('invisible');
    // $('#variablePanel').removeClass('invisible');
    //$('#variablePanel').show();
    // if(! use_var_dropdown){
    //     document.querySelector('#variablePanel #variableSelect').setAttribute('size', Math.min(columns.length, 10));
    //     // $('#variablePanel #variableSelect').attr('size', Math.min(columns.length, 10));
    // }
    document.querySelector('#variablePanel #variableSelectM').setAttribute('size', Math.min(columns.length, 10));
    
    let columns_html = generateColumnsHTML(columns, selected);
    document.querySelector('#variablePanel #variableSelectM').innerHTML = generateColumnsHTML(columns, selected, 0,  false);
    document.querySelector('#variablePanel #variableSelect').innerHTML = columns_html;
    // $('#variablePanel #variableSelect').html(columns_html);
    if(use_var_dropdown){
        let columns_html = generateColumnsHTML(columns, selected, 1);
        document.querySelector('#variablePanel #variableSelect2').innerHTML = columns_html;
        // $('#variablePanel #variableSelect2').html(columns_html);
    }

}

function fc_populateFocus(factors, focus){
    document.querySelector('#focusPanel').classList.remove('invisible');
    document.querySelector('#focusPanel').classList.remove('invisible');
    document.querySelector('#focusPanel').style.display = null;
    let focus_html = generateFocusHTML(factors, focus);
    document.querySelector('#focusPanel .panel-body').innerHTML = focus_html;
}

function fc_showContinue(){

}
function fc_urlError(err){
    alert(err);
}

function fc_exampleError(err){
    alert(err);
}

function fc_formatError(err){
    alert("File is in the wrong format");
}

function fc_tooManyVariables(err){
    document.querySelector('#var-error').textContent = "Too many columns selected";
    document.querySelector('#var-error').style.display = null;
}
function fc_notEnoughVariables(err){
    document.querySelector('#var-error').textContent = "Select a primary variable";
    document.querySelector('#var-error').style.display = null;
}

function fc_wrongModule(err){
    document.querySelector('#var-error').textContent = "Wrong column types for module";
    document.querySelector('#var-error').style.display = null;
}

function fc_showContinue(){
    document.querySelector('#sampleButton').style.display = null;
}

function fc_clear_var_error(){
    document.querySelector('#var-error').style.display = 'none';
}
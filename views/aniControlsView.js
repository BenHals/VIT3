let range_last_event = 0;
let range_timout_event = null;
function generatevisualisationViewHTML(module){
  if (document.querySelector('body').clientWidth < 768) {
    // do something for small screens
    return `
    <div id="visualisationView">
      <div id="takeSamplesProgressContainer" class="progress">
        <div id="takeSamplesProgress" class="progress-bar progress-bar-info progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%">
          <span class="sr-only">0% Complete</span>
        </div>
      </div>
      <div id="visControls">
        <div id="buttonBar">
          <button type="button" class="btn btn-default" aria-label="Back" onclick="sampleOptionsSwitch()">
            <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
          </button>
          <button id="pausePlay" type="button" class="btn btn-default" aria-label="Back" onclick="pauseToggle()">
            <span class="glyphicon glyphicon-pause" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(1, false)">
            <span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>
            1
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(5, false)">
            <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
            5
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(20, false)">
            <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
            20
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(1, true)">
            <span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(5, true)">
            <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(20, true)">
            <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(900, true)">
            <span class="glyphicon glyphicon-flash" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="showCI()">
            <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
          </button>
        </div>
        <input id="visAnimProgress" type="range" min="0" list="stages">
        <datalist id="stages"></datalist>
      </div>
    </div>
    `;
  }else{
    return `
    <div id="visualisationView">
      <div id="takeSamplesProgressContainer" class="progress">
        <div id="takeSamplesProgress" class="progress-bar progress-bar-info progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%">
          <span class="sr-only">0% Complete</span>
        </div>
      </div>
      <div id="visControls">
        <div id="buttonBar">
          <button type="button" class="btn btn-default" aria-label="Back" onclick="sampleOptionsSwitch()">
            <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
            Back to Data Input
          </button>

          <div id = "moduleName" class = "text-center h1">${module}</div>

          <div id="samplePlayButtons" class="playSection panel panel-default">
            <div class="panel-heading">${module.playSectionLabels[0]}</div>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(1, false)">
              <span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>
              <span>1</span>
            </button>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(5, false)">
              <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
              <span>5</span>
            </button>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(20, false)">
              <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
              <span>20</span>
            </button>
          </div>

          <div id="distPlayButtons" class="playSection panel panel-default">
            <div class="panel-heading">${module.playSectionLabels[1]}</div>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(1, true)">
              <span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>
              <span>1</span>
            </button>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(5, true)">
              <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
              <span>5</span>
            </button>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(20, true)">
              <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
              <span>20</span>
            </button>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="distSequence(900, true)">
              <span class="glyphicon glyphicon-flash" aria-hidden="true"></span>
              <span>1000</span>
            </button>
          </div>

          <div id="statsPlayButtons" class="playSection panel panel-default">
            <div class="panel-heading">${module.playSectionLabels[2]}</div>
            <button type="button" class="btn btn-default" aria-label="Back" onclick="showCI()">
              <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        <div id="animationPlayback" class="playSection panel panel-default">
          <div class="panel-heading">Playback Controls</div>
          <button id="pausePlay" type="button" class="btn btn-default" aria-label="Back" onclick="pauseToggle()">
              <span class="glyphicon glyphicon-pause" aria-hidden="true"></span>
            </button>
          <input id="visAnimProgress" type="range" min="0" list="stages">
          <datalist id="stages"></datalist>
        </div>
      </div>
    </div>
    `;
  }
}

function generateAniControlsHTML_old(module_name, labels){
  if (document.querySelector('body').clientWidth < 768) {
    // do something for small screens
    return `
    <div id="visualisationView">
      <div id="takeSamplesProgressContainer" class="progress">
        <div id="takeSamplesProgress" class="progress-bar progress-bar-info progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%">
          <span class="sr-only">0% Complete</span>
        </div>
      </div>
      <div id="visControls">
        <div id="buttonBar">
          <button type="button" class=class="btn btn-primary btn-block" aria-label="Back" onclick="ac_back()">
            <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
          </button>
          <button id="pausePlay" type="button" class="btn btn-default" aria-label="Back" onclick="ac_pauseToggle()">
            <span class="glyphicon glyphicon-pause" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_playAnimation(1, false)">
            <span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>
            1
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_playAnimation(5, false)">
            <span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>
            5
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_playAnimation(20, false)">
            <span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>
            20
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_playAnimation(1, true)">
            <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
            1
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_playAnimation(5, true)">
            <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
            5
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_playAnimation(20, true)">
            <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
            20
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_playAnimation(900, true)">
            <span class="glyphicon glyphicon-forward" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn btn-default" aria-label="Back" onclick="ac_showCI()">
            <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
            CI
          </button>
        </div>
        <input id="visAnimProgress" type="range" min="0" max="1" step="any" list="stages">
        <datalist id="stages"></datalist>
      </div>
    </div>
    `;
  }else{
    return `
    <div id="visualisationView">
      <div id="takeSamplesProgressContainer" class="progress">
        <div id="takeSamplesProgress" class="progress-bar progress-bar-info progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%">
          <span class="sr-only">0% Complete</span>
        </div>
      </div>
      <div id="visControls">
        <div id="control-section-1" class ="control-section">
          <button type="button" class="btn btn-primary btn-block" aria-label="Back" onclick="ac_back()">
            <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
            Back to options
        </button>
        <div id = "moduleName" class = "text-center h1">${module_name}</div>
        <div id="animationPlayback" class="playSection panel panel-default">
          <div class="panel-heading text-center">Playback Controls</div>
            <button id="pausePlay" type="button" class="btn btn-default" aria-label="Back" onclick="ac_pauseToggle()">
                <span class="glyphicon glyphicon-pause" aria-hidden="true"></span>
              </button>
            <input id="visAnimProgress" type="range" min="0" max="1" step="any" list="stages">
            <datalist id="stages"></datalist>
          </div>
        </div>

        <div id="control-section-2" class ="control-section">
          <div id="samplePlayButtons" class="playSection panel panel-default">
            <div class="panel-heading text-center">${labels[0]}</div>
            <div class = "row">
              <div class="col-md-8 radioOption">
                <input id="sampleOptions" type="radio" name="sampleOptions" value="1" checked>
                <label>1</label>
              </div>
            </div>
            <div class = "row">
              <div class="col-md-8 radioOption">
                <input id="sampleOptions" type="radio" name="sampleOptions" value="5">
                <label>5</label>
              </div>
            </div>
            <div class = "row">
              <div class="col-md-8 radioOption">
                <input id="sampleOptions" type="radio" name="sampleOptions" value="20">
                <label>20</label>
              </div>
            </div>
            <div class = "row">
              <div class="col-md-8 radioOption" id="trackDiv">
                <input id="trackpints" type="checkbox" name="sampleOptions" value="20">
                <label class ="form-check-label" for="trackpints" disabled>Animate points and track samples</label>
              </div>
            </div>
            <div class = "row">
              <div class="panelButton col-md-11 ">
                <button type="button" class="btn btn-primary btn-block" aria-label="Back" onclick="ac_readNumSamples('sampleOptions')">
                    Go
                </button> 
              </div>
            </div>  
          </div>
        </div>

        <div id="control-section-3" class ="control-section">
          <div id="buttonBar">
            <div id="distPlayButtons" class="playSection panel panel-default">
              <div class="panel-heading text-center">${labels[1]}</div>
              <div class = "row">
                <div class="col-md-8 radioOption">
                  <input id="distOptions" type="radio" name="distOptions" value="1" checked>
                  <label>1</label>
                </div>
              </div>
              <div class = "row">
                <div class="col-md-8 radioOption">
                  <input id="distOptions" type="radio" name="distOptions" value="5">
                  <label>5</label>
                </div>
              </div>
              <div class = "row">
                <div class="col-md-8 radioOption">
                  <input id="distOptions" type="radio" name="distOptions" value="20">
                  <label>20</label>
                </div>
              </div>
              <div class = "row">
                <div class="col-md-8 radioOption">
                  <input id="distOptions" type="radio" name="distOptions" value="900">
                  <label>1000</label>
                </div>
              </div>
              <div class = "row">
                <div class="panelButton col-md-11 ">
                  <button type="button" class="btn btn-primary btn-block" aria-label="Back" onclick="ac_readNumSamples('distOptions')">
                      Go
                  </button> 
                </div>
              </div>
              <div class = "row" id="CIButton">
                <div class="panelButton col-md-11 ">
                  <button type="button" class="btn btn-default btn-block" aria-label="Back" onclick="ac_showCI()">
                  <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
                  Show CI
                  </button> 
                </div>
              </div> 
              <div class = "row" id="largeCIButton">
                <div class="panelButton col-md-11 ">
                  <button type="button" class="btn btn-default btn-block" aria-label="Back" onclick="ac_showCI(true)">
                  <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
                  Show CI for 10,000 
                  </button> 
                </div>
              </div>
              <div class = "row" id="RandTestCIButton">
                <div class="panelButton col-md-11 ">
                  <button type="button" class="btn btn-default btn-block" aria-label="Back" onclick="ac_showRandTestCI()">
                  <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
                  Show Tail Proportion
                  </button> 
                </div>
              </div>
              <div class = "row" id="largeRandTestCIButton">
                <div class="panelButton col-md-11 ">
                  <button type="button" class="btn btn-default btn-block" aria-label="Back" onclick="ac_showRandTestCI(true)">
                  <span class="glyphicon glyphicon-stats" aria-hidden="true"></span>
                  Show Tail Proportion for 10,000
                  </button> 
                </div>
              </div> 
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }
}

function generateAniControls(module_name){
    let labels = model.selected_module.playSectionLabels;

    // Returns the html for the controls, and functions to populate fields.
    let generator = generateAniControlsHTML_old;
    return [generator(module_name, labels), [ac_initHide(module_name)]];
}

// ********** Ani Control Events **********
function ac_back(){
    controller.aniBack();
}

function ac_pauseToggle(){
  if(controller.paused){
    controller.unpause();
  }else{
    controller.pause();
  }
}

function ac_playAnimation(num_samples, include_distribution, track){
  controller.initAnimation(num_samples, include_distribution, track);
}

function ac_readNumSamples(input_elements){
  let radioGroup = document.querySelector(`input[type="radio"][name='${input_elements}']:checked`);
  let num = radioGroup.value;
  let track = document.querySelector('#trackpints').getAttribute('checked');
  // Second parameter should be true if the distribution animation is playing.
  ac_playAnimation(num, input_elements=="distOptions", track && input_elements=="sampleOptions");
}

function ac_showCI(large = false){
  controller.showCI(large, 'CI');
}
function ac_showRandTestCI(large = false){
  controller.showCI(large, 'randTestCI');
}
document.addEventListener('click', function(e){
  if(!e.target.matches('input[type="radio"]')) return;
  if(e.target.value == 1 && e.target.name == "sampleOptions"){
    document.querySelector('#trackpints').setAttribute('disabled', false);
  }else{
    document.querySelector('#trackpints').setAttribute('disabled', true);
    document.querySelector('#trackpints').setAttribute('checked', false);
  }
});
// $(document).on('change', 'input[type="radio"]', function(){
//   if(this.value == 1 && this.name == "sampleOptions"){
//     $('#trackpints').prop('disabled', false);
//   }else{
//     $('#trackpints').prop('disabled', true);
//     $('#trackpints').prop('checked', false);
//   }
// })
document.addEventListener('input', function(e){
  if(!e.target.matches('#visAnimProgress')) return;
  let event_time = window.performance.now();
  // if(event_time - range_last_event < 50){
  if(false){
    // window.clearTimeout(range_timout_event);
    // range_timout_event = setTimeout(controller.visAnimUserInput(parseFloat(document.querySelector('#visAnimProgress').value)), 500);
  }else{
    // window.clearTimeout(range_timout_event);
    range_last_event = event_time;
    requestAnimationFrame(() => {controller.visAnimUserInput(parseFloat(document.querySelector('#visAnimProgress').value))});
  }
});
document.addEventListener('click', function(e){
  if(!e.target.matches('#visAnimProgress')) return;
  controller.visAnimUserInput(parseFloat(document.querySelector('#visAnimProgress').value));
});
// $(document).on('input', '#visAnimProgress', function(e){
//   controller.visAnimUserInput(parseFloat($('#visAnimProgress').val()));
// });

// ********** Ani Control Updates **********
function ac_initHide(module_name){
  return function(){
    document.querySelector('#visControls').style.display = 'none';
    if(module_name != 'Bootstrapping'){
      let trackDiv = document.querySelector('#trackDiv');
      if(trackDiv) trackDiv.style.display = 'none';
    }else{
      let trackDiv = document.querySelector('#trackDiv');
      if(trackDiv) trackDiv.style.display = null;
    }
    if(module_name == "Bootstrapping"){
      let ci_button = document.querySelector('#CIButton');
      if(ci_button) ci_button.style.display = null;
      let large_ci_button = document.querySelector('#largeCIButton');
      if(large_ci_button) large_ci_button.style.display = null;
    }else{
      let ci_button = document.querySelector('#CIButton');
      if(ci_button) ci_button.style.display = 'none';
      let large_ci_button = document.querySelector('#largeCIButton');
      if(large_ci_button) large_ci_button.style.display = 'none';
    }
    if(module_name == "Randomisation Test"){
      let randtest_button = document.querySelector('#RandTestCIButton');
      if(randtest_button) randtest_button.style.display = null;
    }else{
      let randtest_button = document.querySelector('#RandTestCIButton');
      if(randtest_button) randtest_button.style.display = 'none';
      let large_randtest_button = document.querySelector('#largeRandTestCIButton');
      if(large_randtest_button) large_randtest_button.style.display = 'none';
    }
  }
}
function ac_unpause(){
  document.querySelector('#pausePlay span').classList.remove('glyphicon-play');
  document.querySelector('#pausePlay span').classList.add('glyphicon-pause');
}

function ac_pause(){
  document.querySelector('#pausePlay span').classList.remove('glyphicon-pause');
  document.querySelector('#pausePlay span').classList.add('glyphicon-play');
}

function ac_setPlaybackProgress(p){
  document.querySelector('#visAnimProgress').value = p;
}

function ac_updateProgress(p){
  document.querySelector('#takeSamplesProgress').style.display = null;
  document.querySelector('#takeSamplesProgress').width =  `${p*100}%`;
  document.querySelector('#visControls').style.display = 'none';
}

function ac_loadingDone(){
  document.querySelector('#visControls').style.display = null;
  document.querySelector('#takeSamplesProgressContainer').style.display = 'none';
}

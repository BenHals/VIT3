
const view = {
    switchModule: function(module_html, genControls){
        let module_content = document.querySelector('#moduleContent');
        module_content.innerHTML = module_html;
        // $('#moduleContent').html(module_html);
        if(genControls) this.loadControls(genControls);
        let sample_button = document.querySelector('#sampleButton');
        if (sample_button) sample_button.style.display = 'none';
        // $('#sampleButton').hide();
    },

    loadControls: function(genControls){
        let module_name = model.getModuleName();
        let [control_html, populators] = genControls(module_name);

        // Set the html.
        let controls = document.querySelector('#controls');
        controls.innerHTML = control_html;
        // $('#controls').html(control_html);

        // Populate dynamic fields.
        populators.forEach((genItems)=>{genItems()});
    },

    loadDataDisplay: function(dataset){
        let [html, populators] = generateDataDisplay(dataset);
        
        // Set the html.
        // $('#dataDisplay').html(html);
        let dataDisplay = document.querySelector('#dataDisplay');
        dataDisplay.innerHTML = html;

        // Populate dynamic fields.
        populators.forEach((genItems)=>{genItems()});
    },

    loadCanvas: function(){
        let visualisation = document.querySelector('#visualisation');
        visualisation.innerHTML = `<div id="canvasWrapper">
        <svg id="popSVG" class="mainCanvas"><g id="popSvgContainer"></g></svg>
        <svg id="ghostSVG" class="mainCanvas"><g id="ghostSVGContainer"></g></svg>
        <svg id="dynamicSVG" class="mainCanvas"><g id="dynSvgContainer"></g></svg>
        </div>`;
        // $('#visualisation').html(`<div id="canvasWrapper">
        //     <svg id="popSVG" class="mainCanvas"><g id="popSvgContainer"></g></svg>
        //     <svg id="ghostSVG" class="mainCanvas"><g id="ghostSVGContainer"></g></svg>
        //     <svg id="dynamicSVG" class="mainCanvas"><g id="dynSvgContainer"></g></svg>
        //     </div>`);
        this.resizeCanvas(true);
    },

    resizeCanvas: function(init){
        if(!document.querySelector('#canvasWrapper')) return {"scale_x": 1, "scale_y": 1,  "PIXEL_RATIO": 1};
        let vis_width = document.querySelector('#canvasWrapper').offsetWidth;
        let vis_height = document.querySelector('#canvasWrapper').offsetHeight;
        let popSVG = document.querySelector('#popSVG');
        let dynamicSVG = document.querySelector('#dynamicSVG');
        let ghostSVG = document.querySelector('#ghostSVG');
        if(init){
            
            dynamicSVG.setAttribute('data-normWidth', vis_width);
            dynamicSVG.setAttribute('data-normHeight', vis_height);
            popSVG.setAttribute('data-normWidth', vis_width);
            ghostSVG.setAttribute('data-normWidth', vis_width);
            popSVG.setAttribute('data-normHeight', vis_height);
            ghostSVG.setAttribute('data-normHeight', vis_height);
            
            dynamicSVG.setAttribute('width', vis_width);
            dynamicSVG.setAttribute('height', vis_height);
            popSVG.setAttribute('width', vis_width);
            ghostSVG.setAttribute('width', vis_width);
            popSVG.setAttribute('height', vis_height);
            ghostSVG.setAttribute('height', vis_height);
        }
        let scale_factor = popSVG.getAttribute('width') / (popSVG.getAttribute('data-normWidth'))
        let canvas_rect = document.getElementById('canvasWrapper');
        if(!canvas_rect){
            return {"scale_x": 1, "scale_y": 1,  "PIXEL_RATIO": 1};
        }
        canvas_rect = canvas_rect.getBoundingClientRect();
        let shift = (vis_width - document.getElementById('canvasWrapper').getAttribute('data-normWidth'))/2;
        //dynamicSVG.setAttribute('width', vis_width);
        //dynamicSVG.setAttribute('height', vis_height);
        dynamicSVG.setAttribute('transform', "scale("+scale_factor+",1)");
        let dRect = document.getElementById('dynamicSVG').getBoundingClientRect();
        //popSVG.setAttribute('transform', "translate("+popSVG.setAttribute('width')/2+","+popSVG.setAttribute('height')/2 + ") scale("+scale_factor+",1) translate("+-1*popSVG.setAttribute('width')/2+","+-1*popSVG.setAttribute('height')/2 + ")");
        dynamicSVG.setAttribute('transform', "scale("+scale_factor+",1) translate("+(canvas_rect.left - dRect.left)/scale_factor+",0)");

        //popSVG.setAttribute('width', vis_width);
        //ghostSVG.setAttribute('height', vis_height);
        popSVG.setAttribute('transform', "scale("+scale_factor+",1)");
        ghostSVG.setAttribute('transform', "scale("+scale_factor+",1)");
        let pRect = document.getElementById('popSVG').getBoundingClientRect();
        let gRect = document.getElementById('ghostSVG').getBoundingClientRect();
        //popSVG.setAttribute('transform', "translate("+popSVG.setAttribute('width')/2+","+popSVG.setAttribute('height')/2 + ") scale("+scale_factor+",1) translate("+-1*popSVG.setAttribute('width')/2+","+-1*popSVG.setAttribute('height')/2 + ")");
        //ghostSVG.setAttribute('transform', "translate("+popSVG.setAttribute('width')/2+","+popSVG.setAttribute('height')/2 + ") scale("+scale_factor+",1) translate("+-1*popSVG.setAttribute('width')/2+","+-1*popSVG.setAttribute('height')/2 + ")");
        popSVG.setAttribute('transform', "scale("+scale_factor+",1) translate("+(canvas_rect.left - pRect.left)/scale_factor+",0)");
        ghostSVG.setAttribute('transform', "scale("+scale_factor+",1) translate("+(canvas_rect.left - gRect.left)/scale_factor+",0)");

        return {"scale_x": 1, "scale_y": 1,  "PIXEL_RATIO": 1};
    }
}
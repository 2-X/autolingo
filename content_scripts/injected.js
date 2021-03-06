import ReactUtils from "./ReactUtils.js"
import DuolingoSkill from "./DuolingoSkill.js"
import DuolingoChallenge from "./DuolingoChallenge.js"

const DEBUG = false;

// append an iframe so we can re-enable console.log
// using its console.logger
const frame = document.createElement('iframe');
document.body.appendChild(frame);

// if DEBUG, re-enable console.log as console.logger
const welcome_message = "Welcome to Autolingo v1.0!";
if (DEBUG) {
    console.logger = (...content) => {
        frame.contentWindow.console.log(...content);
    }
} else {
    console.logger = () => {}
}

// print our welcome message regardless
frame.contentWindow.console.log(welcome_message);

// if the user changes the language, re-inject
let previous_language = null;
setInterval(() => {
    // get the current language from the page
    const page_data = new ReactUtils().ReactFiber(document.querySelector("._3BJQ_"))?.return?.stateNode?.props;
    const current_language = page_data?.courses?.find(e => { return e.isCurrent; })?.learningLanguageId;

    // DEBUG INFO
    console.logger(previous_language, current_language);

    // if the language changed, we know we just loaded the home page
    if (previous_language !== current_language) {
        inject_autolingo();
        previous_language = current_language;
    }
}, 100);

let stylesheet_loaded = false;
let the_extension_id = null;
// inject stylesheet, buttons, etc.
const inject = (extension_id) => {
    the_extension_id = extension_id;
    // inject stylesheet
    let stylesheet = document.createElement("LINK");
    stylesheet.setAttribute("rel", "stylesheet")
    stylesheet.setAttribute("type", "text/css")
    stylesheet.setAttribute("href", `${the_extension_id}/content_scripts/main.css`)
    document.body.appendChild(stylesheet)
    stylesheet.onload = () => {
        stylesheet_loaded = true;
    }

    // complete the current challenge when the user clicks
    // the corresponding button in the popup
    document.addEventListener("complete_challenge", () => {
        const challenge = new DuolingoChallenge();
        challenge.solve();
        challenge.click_next();
        challenge.click_next();
    });
}

const inject_autolingo = () => {
    console.logger(stylesheet_loaded, the_extension_id);
    const i = setInterval(() => {
        if (stylesheet_loaded && the_extension_id) {
            clearInterval(i);

            const tier_img_url = `${the_extension_id}/images/diamond-league.png`;
    
            // iterate over all skills
            let all_skill_nodes = document.querySelectorAll("div[data-test='skill']");
            console.logger(all_skill_nodes)
            all_skill_nodes.forEach(skill_node => {
    
                // find the name of each skill node
                const skill_name_node = skill_node.children[0].children[0].children[1];
    
                // get skill metadata
                const skill_metadata = new ReactUtils().ReactFiber(skill_name_node).return.pendingProps.skill;
    
                // only add these buttons to unlocked lessons
                const unlocked = skill_metadata.accessible;
                if (unlocked) {
    
                    // add start skill button with tooltip to a container DIV
                    let start_autolingo_skill_container = document.createElement("DIV");
                    start_autolingo_skill_container.className = "start-autolingo-skill-container";
    
                    let start_autolingo_skill_tooltip = document.createElement("DIV");
                    start_autolingo_skill_tooltip.className = "tooltip";
    
                    // append a lil button to each skill
                    // when clicked, this button starts an auto-lesson
                    let start_autolingo_skill = document.createElement("IMG");
                    start_autolingo_skill.src = tier_img_url;
                    start_autolingo_skill.className = "start-autolingo-skill";
    
                    // on click, start the lesson and let the extension know it's time to autocomplete
                    start_autolingo_skill.onclick = () => {
                        let ds = new DuolingoSkill(skill_node, skill_metadata);
                        ds.start();
                    }
    
                    // show tooltip when hovering over the auto-lesson buttons
                    let start_autolingo_tooltip_text = document.createElement("SPAN");
                    start_autolingo_tooltip_text.innerText = "Autocomplete lesson with AutoLingo.";
                    start_autolingo_tooltip_text.className = "tooltip-text";
    
                    // append nodes to eachother
                    start_autolingo_skill_tooltip.appendChild(start_autolingo_tooltip_text);
                    start_autolingo_skill_tooltip.appendChild(start_autolingo_skill);
                    start_autolingo_skill_container.appendChild(start_autolingo_skill_tooltip);
                    skill_node.appendChild(start_autolingo_skill_container);
                }
            });
    
            // add our custom hotkeys
            set_hotkeys();
        }
    })
}

const set_hotkeys = () => {
    document.addEventListener("keydown", e => {

        // ALT+S to skip the current challenge
        if (e.key === "s" && e.altKey) {
            const skip_challenge_button = document.querySelector("button[data-test='player-skip']");
            if (skip_challenge_button) {
                skip_challenge_button.click();
            }
        }

    });
}

// get chrome extension's ID
document.addEventListener("extension_id", e => {
    const extension_id = `chrome-extension://${e.detail.data}`;

    // inject when we have the extension's ID
    inject(extension_id);
});

// ask for the chrome extension's ID
window.dispatchEvent(
    new CustomEvent("get_extension_id", { detail: null })
);

var enabled;

const set_badge = (is_enabled) => {
    chrome.browserAction.setBadgeText({text: is_enabled ? "✓" : "X"});
    chrome.browserAction.setBadgeBackgroundColor({color: is_enabled ? "green" : "#EC5053"});
}

// check user credentials every .5s
setInterval(() => {
    chrome.storage.local.get(
        "autolingo_enabled",
        (response) => {
            set_badge(Boolean(response["autolingo_enabled"]));
        }
    );
}, 10);

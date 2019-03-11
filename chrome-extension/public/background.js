/*global chrome*/

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.action) {
    case 'popupOpen': {
      console.log('popup is open...');
      chrome.storage.local.get(['user'], function(response) {
        if (!response.user) {
          chrome.identity.getProfileUserInfo(function(result) {
            validateEmail(result.email);
            chrome.storage.local.set({
              resumeCount: 0,
              mailCount: 0,
              smsCount: 0,
              user: result.user
            });
          });
        }
      });
      break;
    }
    default: {
      console.log('no popup');
    }
  }
});

chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(async function(msg) {
    console.log('Received: ' + msg);
    if (msg === 'Requesting crawling') {
      let user = '';
      await chrome.storage.local.get(['user'], async function(response) {
        if (!response.user) {
          await chrome.identity.getProfileUserInfo(async function(result) {
            await chrome.storage.local.set({
              resumeCount: 0,
              mailCount: 0,
              smsCount: 0
            });
            user = await validateEmail(result.email);
            console.log('user', user);
          });
        } else {
          user = response.user;
          console.log('user is already logged in.');
        }

        await getURL();
        await getHTML();
        await getHistory();
        await crawlCandidate();
        await compileMessage(port);
        // chrome.storage.local.get(null, response => {
        //   console.log(response);
        //   port.postMessage(response);
        // });
      });
    } else if (msg === 'Requesting reset')
      chrome.storage.local.set(
        {
          resumeCount: 0,
          mailCount: 0,
          smsCount: 0
        },
        response => console.log(response)
      );
  });
});

function validateEmail(email) {
  const api = 'http://128.199.203.161:8500/extension/login';
  const input = { email: email };
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Origin': '*'
  };
  fetch(api, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(input)
  })
    .then(response => response.json())
    .then(responseJson => {
      if (responseJson.result.check === true) {
        chrome.storage.local.set({ user: responseJson.result });
      } else {
        console.log('Unauthorized user!');
      }
    })
    .catch(error => console.log(error));
}

const getURL = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([currentTab]) => {
      resolve(chrome.storage.local.set({ url: currentTab.url }));
    });
  });
};

const getHTML = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      null,
      { code: 'var html = document.documentElement.outerHTML; html' },
      html => {
        resolve(chrome.storage.local.set({ html: html[0] }));
      }
    );
  });
};

const getHistory = () => {
  return new Promise((resolve, reject) => {
    resolve(
      chrome.storage.local.get(null, response => {
        fetch('http://128.199.203.161:8500/extension/view_history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Origin': '*'
          },
          body: JSON.stringify({
            user_id: response.user.user_id,
            user_name: response.user.user_name,
            url: response.url
          })
        });
      })
    )
      .then(data => data.json())
      .then(result => chrome.storage.local.set({ history: result }))
      .catch(error => console.log(error));
  });
};

const crawlCandidate = () => {
  const api = 'http://128.199.203.161:8500/extension/parsing';
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Origin': '*'
  };
  return new Promise((resolve, reject) => {
    resolve(
      chrome.storage.local.get(null, response => {
        const input = {
          user_id: response.user.user_id,
          user_name: response.user.user_name,
          url: response.url,
          html: response.html
        };
        console.log('crawl inputs: ', input);
        fetch(api, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(input)
        });
      })
    )
      .then(data => data.json())
      .then(json => chrome.storage.local.set({ candidate: json.result }))
      .catch(error => console.log(error));
  });
};

const compileMessage = port => {
  return new Promise((resolve, reject) => {
    resolve(
      chrome.storage.local.get(null, response => {
        const message = {
          user: response.user,
          url: response.url,
          html: response.html,
          history: response.history,
          resumeCount: response.resumeCount,
          candidate: response.candidate
        };
        return message;
      })
    )
      .then(message => port.postMessage(message))
      .catch(error => console.log(error));
  });
};

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

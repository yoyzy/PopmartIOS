/*
 * MIT License
 * 
 * Copyright (c) 2025 2voi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */ 

let isProcessing = false;

document.getElementById("saveBtn").addEventListener("click", function(event) {
  event.preventDefault();
  const Aregister = document.getElementById("Aregister").checked ? "n" : "y";
  const Nregister = document.getElementById("Nregister").checked ? "n" : "y";
  const Lregister = document.getElementById("Lregister").checked ? "n" : "y";
  const branch = document.getElementById("branch").value;
  const day = document.getElementById("day").value;
  const time = document.getElementById("time").value;

  chrome.storage.local.set({ Aregister, Nregister, Lregister, branch, day, time }, () => {
    alert("ข้อมูลถูกบันทึกแล้ว!");
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['Aregister','Nregister','Lregister','branch','day','time'], (data) => {
    document.getElementById('Aregister').checked = data.Aregister === "n";
    document.getElementById('Nregister').checked = data.Nregister === "n";
    document.getElementById('Lregister').checked = data.Lregister === "n";
    if (data.branch) document.getElementById('branch').value = data.branch;
    if (data.day) document.getElementById('day').value = data.day;
    if (data.time) document.getElementById('time').value = data.time;
  });
});

document.getElementById("stopBtn").addEventListener("click", function() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => { window.isStopped = true; }
    });
  });
  alert("หยุดการทำงาน");
});

document.getElementById("startBtn").addEventListener("click", function(event) {
  event.preventDefault();
  if (isProcessing) return;

  isProcessing = true;
  const Aregister = document.getElementById("Aregister").checked ? "n" : "y";
  const Nregister = document.getElementById("Nregister").checked ? "n" : "y";
  const Lregister = document.getElementById("Lregister").checked ? "n" : "y";
  const branch = document.getElementById("branch").value;
  const day = document.getElementById("day").value;
  const time = document.getElementById("time").value;

  chrome.storage.local.set({ Aregister, Nregister, Lregister, branch, day, time });

  const isConfirmed = confirm("ยืนยัน เริ่มต้นการทำงาน");

  if (isConfirmed) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => { window.isStopped = false; }
      }, () => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: clickMyBookings,
          args: [{ Aregister, Nregister, Lregister, branch, day, time }]
        });
      });
    });
  }

  isProcessing = false;
});

async function clickMyBookings(details) {
  console.log("Bookings Running...", details);

  async function clickButton(xpath, name) {
    let button = null, attempts = 0;
    const max = 500;

    while (!button && attempts < max) {
      if (window.isStopped) return;

      button = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (button && !button.disabled) {
        button.click();
        console.log(`Clicked "${name}"`);
        if (details.Aregister === "n") {
          console.log("Low")
          await new Promise(res => setTimeout(res, 200));
        }else{
          console.log("Fast")
          await new Promise(res => setTimeout(res, 50));
        }
        return;
      }

      console.log(`Retrying "${name}"...`);
      attempts++;
      await new Promise(res => setTimeout(res, 1000));
    }

    console.log(`"${name}" not found`);
  }

  async function clickDayButton(day) {
    const xpath = `//button[text()='${day}']`;
    let button = null, attempts = 0, max = 50;

    while (!button && attempts < max) {
      if (window.isStopped) return;

      button = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (button && !button.disabled && button.offsetParent !== null) {
        button.click();
        console.log(`Clicked Day "${day}"`);
        return;
      }

      console.log(`Waiting for Day "${day}"... attempt ${attempts + 1}`);
      attempts++;
      await new Promise(res => setTimeout(res, 500));
    }

    console.log(`Day "${day}" not found`);
  }

  async function clickFirstInput() {
    if (window.isStopped) return;
    let input = document.querySelector('input[type="checkbox"]');
    if (input && !input.checked) input.click();
  }

  let currentTime = details.time;

  do {
    try {
      details.time = currentTime;
      if (window.isStopped) break;

      if (details.Nregister === "n") {
        await new Promise(res => setTimeout(res, 2000));
      } else {
        await new Promise(res => setTimeout(res, 100));
        await clickButton("//div//*[text()='Register']", "Register");
      }

      if (details.branch !== "None") {
        if (details.Aregister === "n") {
          console.log("รอค้างสาขา");
          await new Promise(res => setTimeout(res, 2000));
          await clickButton(`//div//*[text()='${details.branch}']`, "Branch");
        } else {
          await new Promise(res => setTimeout(res, 100));
          await clickButton(`//div//*[text()='${details.branch}']`, "Branch");
        }
      } else {
        await new Promise(res => setTimeout(res, 2500));
      }

      await new Promise(res => setTimeout(res, 100));
      await clickButton("//button[text()='Next']", "Next");

      if (details.Aregister === "n") {
        console.log("รอค้างวันที่");
        await new Promise(res => setTimeout(res, 2500));
      }
      await clickDayButton(details.day);

      if (details.time !== "None") {
        await new Promise(res => setTimeout(res, 100));
        await clickButton(`//button[text()='${details.time}']`, "Time");
      } else {
        console.error("รอ...กดรอบ");
        await new Promise(res => setTimeout(res, 2500));
      }

      await new Promise(res => setTimeout(res, 100));
      await clickButton("//button[text()='Confirm']", "Confirm");
      await new Promise(res => setTimeout(res, 200));
      await clickFirstInput();
      await new Promise(res => setTimeout(res, 100));
      await clickButton("//button[text()='Confirm Booking']", "Confirm Booking");

    } catch (err) {
      console.error("Error during booking:", err);
    }

    if (details.Lregister === "y" && !window.isStopped) {
      function addMinutesToTime(timeStr, minutesToAdd) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes + minutesToAdd);

        const newHours = date.getHours().toString().padStart(2, '0');
        const newMinutes = date.getMinutes().toString().padStart(2, '0');
        return `${newHours}:${newMinutes}`;
      }

      currentTime = addMinutesToTime(currentTime, 30);
      console.log("Waiting to repeat...");
      await new Promise(res => setTimeout(res, 2000));
    }

  } while (details.Lregister === "y" && !window.isStopped);
}

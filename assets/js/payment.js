const _w = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4cVgyWmp2MTNHa01JUjNCclBudDBQZTNKUHV6NnkxYUo2YVM1dWlmcnV6ZnJtaGFuNktBRVVsLWxXMkQ2UTd2ZC0vZXhlYw==";
const WEBHOOK_URL = atob(_w);
const urlParams = new URLSearchParams(window.location.search);
const activeMarketer = urlParams.get("ref") || urlParams.get("marketer") || localStorage.getItem("optiline_marketer_ref") || "Direct_Sale";

let currentPaymentId = "";
let countdownInterval;
let autoPollInterval;
let isGenerateLocked = false;

function isValidFullName(name) {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  return parts.length >= 2 && parts[0].length >= 2 && parts[1].length >= 2;
}

function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email.trim());
}

function setFieldError(inputEl, errorEl, show) {
  if (show) {
    inputEl.parentElement.style.borderColor = "transparent";
    inputEl.style.borderColor = "#f87171";
    inputEl.style.boxShadow = "0 0 0 3px rgba(248, 113, 113, 0.15)";
    errorEl.classList.add("visible");
  } else {
    inputEl.style.borderColor = "";
    inputEl.style.boxShadow = "";
    errorEl.classList.remove("visible");
  }
}

document.addEventListener("DOMContentLoaded", function () {
   const modal = document.getElementById("opti-crypto-modal");
  const openBtn = document.getElementById("open-crypto-modal");
  const generateBtn = document.getElementById("generate-payment");
  const copyBtn = document.getElementById("copy-address-btn");
  const verifyBtn = document.getElementById("verify-payment-btn");
  const verifyMsg = document.getElementById("verify-status-msg");
  const selectElement = document.getElementById("crypto-select");
  const nameInput = document.getElementById("client-name");
  const emailInput = document.getElementById("client-email");
  const nameError = document.getElementById("name-error");
  const emailError = document.getElementById("email-error");
  let isProcessing = false;

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      modal.classList.add("active");
      showPhase("selection");
      setTimeout(() => {
        document.querySelector(".opti-modal-content").classList.add("entrance-complete");
      }, 50);
    });
  }

  function closeModal() {
    modal.classList.remove("active");
    document.querySelector(".opti-modal-content").classList.remove("entrance-complete");
    setTimeout(() => {
      showPhase("selection");
      if (nameInput) {
        nameInput.value = "";
        setFieldError(nameInput, nameError, false);
      }
      if (emailInput) {
        emailInput.value = "";
        setFieldError(emailInput, emailError, false);
      }
      verifyMsg.style.display = "none";
      verifyMsg.innerText = "";
      verifyMsg.style.color = "#a855f7";
      const verifyBtn = document.getElementById("verify-payment-btn");
      if (verifyBtn) verifyBtn.style.display = "block";
      const resetBtn = document.getElementById("reset-payment-btn");
      if (resetBtn) resetBtn.style.display = "none";
      const qrImg = document.getElementById("payment-qr");
      if (qrImg) qrImg.style.opacity = "1";
      currentPaymentId = "";
      clearInterval(countdownInterval);
      clearInterval(autoPollInterval);
    }, 300);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
  });

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      if (nameError.classList.contains("visible")) {
        setFieldError(nameInput, nameError, !isValidFullName(nameInput.value));
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", () => {
      if (emailError.classList.contains("visible")) {
        setFieldError(emailInput, emailError, !isValidEmail(emailInput.value));
      }
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      if (isProcessing) return;
      if (isGenerateLocked) {
        let msgDiv = document.getElementById("cooldown-msg");
        if (!msgDiv) {
          msgDiv = document.createElement("div");
          msgDiv.id = "cooldown-msg";
          msgDiv.style.color = "#c084fc";
          msgDiv.style.fontSize = "0.85rem";
          msgDiv.style.marginTop = "12px";
          msgDiv.style.textAlign = "center";
          msgDiv.style.fontWeight = "600";
          generateBtn.parentNode.appendChild(msgDiv);
        }
        msgDiv.innerText = "Please wait 30 seconds before requesting a new address.";
        msgDiv.style.display = "block";
        setTimeout(() => { msgDiv.style.display = "none"; }, 5000);
        return;
      }

      const clientName = nameInput.value.trim();
      const clientEmail = emailInput.value.trim();
      const nameValid = isValidFullName(clientName);
      const emailValid = isValidEmail(clientEmail);
      
      setFieldError(nameInput, nameError, !nameValid);
      setFieldError(emailInput, emailError, !emailValid);
      if (!nameValid || !emailValid) return;
      
      isGenerateLocked = true;
      setTimeout(() => { isGenerateLocked = false; }, 30000);
      isProcessing = true;
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
      
      const selectedCoin = selectElement.value;
      const priceText = document.querySelector(".checkout-total").innerText.replace(/[^0-9.]/g, '');
      const dynamicPrice = parseFloat(priceText);
      let dynamicPackName = "OPTILINE PACK";
      const headerEl = document.querySelector(".checkout-header h1");
      if (headerEl) {
        dynamicPackName = headerEl.innerText.replace("Initialize ", "").toUpperCase() + " PACK";
      }

      try {
        const tempOrderId = `${activeMarketer}|||${clientEmail}|||${clientName}`;
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "create_payment",
            price_amount: dynamicPrice,
            pay_currency: selectedCoin,
            order_id: tempOrderId,
            order_description: dynamicPackName
          })
        });

        const data = await response.json();

        if (data.payment_id && data.pay_address) {
          currentPaymentId = data.payment_id;
          updatePaymentDetails(data, selectedCoin);
          showPhase("details");
          startCountdown();
          startAutoPolling();
        } else {
          throw new Error("Payment generation failed");
        }
      } catch (error) {
        alert("Connection failed. Please check your internet connection and try again.");
        isGenerateLocked = false;
      } finally {
        isProcessing = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span>Generate Payment Address</span><i class="fas fa-bolt"></i>';
      }
    });
  }

  const copyAmountBtn = document.getElementById("copy-amount-btn");
  if (copyAmountBtn) {
    copyAmountBtn.addEventListener("click", async () => {
      const amountText = document.getElementById("pay-amount").innerText.replace(/[^0-9.]/g, '');
      try {
        await navigator.clipboard.writeText(amountText);
        copyAmountBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyAmountBtn.classList.add("copied");
        setTimeout(() => {
          copyAmountBtn.innerHTML = '<i class="far fa-copy"></i>';
          copyAmountBtn.classList.remove("copied");
        }, 2000);
      } catch (err) {}
    });
  }

  const copyAddressBtn = document.getElementById("copy-address-btn");
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", async () => {
      const addressText = document.getElementById("wallet-address").innerText;
      try {
        await navigator.clipboard.writeText(addressText);
        const originalHTML = copyAddressBtn.innerHTML;
        copyAddressBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
        copyAddressBtn.classList.add("copied");
        copyAddressBtn.disabled = true;
        setTimeout(() => {
          copyAddressBtn.innerHTML = originalHTML;
          copyAddressBtn.classList.remove("copied");
          copyAddressBtn.disabled = false;
        }, 2500);
      } catch (err) {
        const addressEl = document.getElementById("wallet-address");
        const range = document.createRange();
        range.selectNode(addressEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        alert("Address selected. Press Ctrl+C / Cmd+C to copy.");
      }
    });
  }

  if (verifyBtn) {
    verifyBtn.addEventListener("click", async () => {
      if (!currentPaymentId) return;
      verifyBtn.disabled = true;
      const originalHTML = verifyBtn.innerHTML;
      verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying on Blockchain...';
      verifyMsg.style.display = "block";
      verifyMsg.innerText = "Querying blockchain network. This may take a moment...";
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "check_status", payment_id: currentPaymentId })
        });
        const data = await response.json();
        const status = data.payment_status;
        
        if (status === "finished" || status === "confirmed") {
          verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Confirmed!';
          verifyMsg.style.display = "none";
          setTimeout(() => { 
            showPhase("success"); 
          }, 1200);
        } else if (status === "partially_paid") {
          const remaining = data.actually_paid ? (data.pay_amount - data.actually_paid).toFixed(8) : "some amount";
          verifyMsg.innerText = `Partial payment received. Please send the remaining ${remaining} to complete the transaction.`;
          verifyBtn.innerHTML = originalHTML;
          verifyBtn.disabled = false;
        } else if (status === "sending" || status === "confirming") {
          verifyMsg.innerText = "Transaction detected and currently confirming on the network. Please check again in a moment.";
          verifyBtn.innerHTML = originalHTML;
          verifyBtn.disabled = false;
        } else if (status === "expired") {
          verifyMsg.innerText = "This payment address has expired. Please generate a new payment to continue.";
          verifyBtn.innerHTML = originalHTML;
          verifyBtn.disabled = false;
        } else {
          verifyMsg.innerText = `Status: ${(status || 'pending').replace(/_/g, " ").toUpperCase()}. Awaiting network confirmation. Please try again shortly.`;
          verifyBtn.innerHTML = originalHTML;
          verifyBtn.disabled = false;
        }
      } catch (error) {
        verifyMsg.innerText = "Network error while verifying. Please check your connection and try again.";
        verifyBtn.innerHTML = originalHTML;
        verifyBtn.disabled = false;
      }
    });
  }

  async function checkPaymentStatusSilent() {
    if (!currentPaymentId) return;
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "check_status", payment_id: currentPaymentId })
      });
      const data = await response.json();
      const status = data.payment_status;
      if (status === "finished" || status === "confirmed") {
        clearInterval(autoPollInterval);
        clearInterval(countdownInterval);
        showPhase("success");
      } else if (status === "partially_paid") {
        const remaining = data.actually_paid ? (data.pay_amount - data.actually_paid).toFixed(8) : "some amount";
        verifyMsg.style.display = "block";
        verifyMsg.innerText = `Partial payment detected! We received ${data.actually_paid}. Please send exactly ${remaining} to complete the order.`;
      }
    } catch (err) {}
  }

  function startAutoPolling() {
    clearInterval(autoPollInterval);
    autoPollInterval = setInterval(checkPaymentStatusSilent, 10000);
  }

  function startCountdown() {
    clearInterval(countdownInterval);
    let time = 1200;
    const timerDisplay = document.querySelector("#payment-timer span");
    const verifySection = document.querySelector(".opti-verify-section");
    const verifyBtn = document.getElementById("verify-payment-btn");
    const qrImg = document.getElementById("payment-qr");
    countdownInterval = setInterval(() => {
      time--;
      let minutes = Math.floor(time / 60);
      let seconds = time % 60;
      timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      if (time <= 0) {
        clearInterval(countdownInterval);
        clearInterval(autoPollInterval);
        timerDisplay.innerText = "EXPIRED";
        qrImg.style.opacity = "0.1";
        verifyMsg.style.display = "block";
        verifyMsg.style.color = "#f87171";
        verifyMsg.innerText = "This address has expired. Please generate a new one.";
        verifyBtn.style.display = "none";
        let resetBtn = document.getElementById("reset-payment-btn");
        if (!resetBtn) {
          resetBtn = document.createElement("button");
          resetBtn.id = "reset-payment-btn";
          resetBtn.className = "opti-secondary-btn";
          resetBtn.style.marginTop = "10px";
          resetBtn.innerHTML = '<i class="fas fa-redo"></i> Generate New Address';
          resetBtn.addEventListener("click", () => {
            closeModal();
            setTimeout(() => {
              modal.classList.add("active");
            }, 400);
          });
          verifySection.insertBefore(resetBtn, verifyMsg);
        } else {
          resetBtn.style.display = "block";
        }
      }
    }, 1000);
  }
});

function showPhase(phaseId) {
  const phases = document.querySelectorAll(".opti-modal-phase");
  phases.forEach((p) => p.classList.remove("active"));
  const targetPhase = document.getElementById(`opti-phase-${phaseId}`);
  if (targetPhase) {
    targetPhase.classList.add("active");
    const elements = targetPhase.querySelectorAll('[style*="animation"]');
    elements.forEach((el) => {
      const anim = el.style.animation;
      el.style.animation = "none";
      el.offsetHeight;
      el.style.animation = anim;
    });
  }
}

function updatePaymentDetails(data, coin) {
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(data.pay_address)}&size=300&margin=1&dark=1a0633`;
  const qrImg = document.getElementById("payment-qr");
  qrImg.style.opacity = "1";
  qrImg.src = qrUrl;
  
  document.getElementById("pay-amount").innerText = `${parseFloat(data.pay_amount).toFixed(8).replace(/\.?0+$/, "")}`;
  
  const cryptoNameEl = document.getElementById("selected-crypto-name");
  if (cryptoNameEl) {
    cryptoNameEl.innerText = coin.toUpperCase();
  }
  
  document.getElementById("wallet-address").innerText = data.pay_address;
  
  const warningText = document.querySelector("#network-warning p");
  if (coin === "usdttrc20") {
    warningText.innerText = "Send USDT exclusively through the TRC20 (TRON) network. Sending via any other network will result in permanent loss of funds.";
  } else {
    const networkMap = {
      usdterc20: "ERC20 (Ethereum)",
      usdtbsc: "BEP20 (Binance Smart Chain)",
      bnbbsc: "BEP20 (Binance Smart Chain)",
      btc: "Bitcoin Network",
      eth: "Ethereum Network",
      sol: "Solana Network",
      ltc: "Litecoin Network",
      trx: "TRON Network",
      doge: "Dogecoin Network",
      shib: "Ethereum Network (ERC20)",
      usdc: "Ethereum Network (ERC20)"
    };
    const networkName = networkMap[coin] || coin.toUpperCase();
    warningText.innerText = `Send funds exclusively through the ${networkName}. Sending via any other network will result in permanent loss of funds.`;
  }
}
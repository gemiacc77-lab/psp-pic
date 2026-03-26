if (!window.OptilinePaymentInitialized) {
  window.OptilinePaymentInitialized = true;

  const _w =
    "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4cVgyWmp2MTNHa01JUjNCclBudDBQZTNKUHV6NnkxYUo2YVM1dWlmcnV6ZnJtaGFuNktBRVVsLWxXMkQ2UTd2ZC0vZXhlYw==";
  const WEBHOOK_URL = atob(_w);
  const urlParams = new URLSearchParams(window.location.search);
  const activeMarketer =
    urlParams.get("ref") ||
    urlParams.get("marketer") ||
    localStorage.getItem("optiline_marketer_ref") ||
    "Direct_Sale";
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
    document.getElementById("pay-amount").innerText = `${parseFloat(
      data.pay_amount,
    )
      .toFixed(8)
      .replace(/\.?0+$/, "")}`;
    const usdEquiv = document.querySelectorAll(
      ".opti-info-row span:last-child",
    )[1];
    if (usdEquiv) usdEquiv.style.color = "#c084fc";
    const cryptoNameEl = document.getElementById("selected-crypto-name");
    if (cryptoNameEl) cryptoNameEl.innerText = coin.toUpperCase();
    document.getElementById("wallet-address").innerText = data.pay_address;
    const warningText = document.querySelector("#network-warning p");
    if (coin === "usdttrc20") {
      warningText.innerText =
        "Send USDT exclusively through the TRC20 (TRON) network. Sending via any other network will result in permanent loss of funds.";
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
        usdc: "Ethereum Network (ERC20)",
      };
      const networkName = networkMap[coin] || coin.toUpperCase();
      warningText.innerText = `Send funds exclusively through the ${networkName}. Sending via any other network will result in permanent loss of funds.`;
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

    function resetExpiredUI() {
      const qrImg = document.getElementById("payment-qr");
      if (qrImg) {
        qrImg.style.filter = "none";
        qrImg.style.opacity = "1";
      }
      const walletAddr = document.getElementById("wallet-address");
      const copyAddrBtn = document.getElementById("copy-address-btn");
      if (walletAddr) {
        walletAddr.style.filter = "none";
        walletAddr.style.userSelect = "auto";
        walletAddr.style.pointerEvents = "auto";
      }
      if (copyAddrBtn) {
        copyAddrBtn.style.pointerEvents = "auto";
        copyAddrBtn.style.opacity = "1";
      }
      const payAmount = document.getElementById("pay-amount");
      const copyAmtBtn = document.getElementById("copy-amount-btn");
      if (payAmount) {
        payAmount.style.filter = "none";
        payAmount.style.userSelect = "auto";
      }
      if (copyAmtBtn) {
        copyAmtBtn.style.pointerEvents = "auto";
        copyAmtBtn.style.opacity = "1";
      }
      const timerContainer = document.getElementById("payment-timer");
      if (timerContainer) {
        timerContainer.innerHTML = "Price locked for: <span>20:00</span>";
        timerContainer.style.color = "";
      }
      if (verifyMsg) verifyMsg.style.display = "none";
      if (verifyBtn) verifyBtn.style.display = "block";
      const resetBtn = document.getElementById("reset-payment-btn");
      if (resetBtn) resetBtn.style.display = "none";
    }

    function startCountdown() {
      clearInterval(countdownInterval);
      let time = 1200;
      const timerContainer = document.getElementById("payment-timer");
      const timerDisplay = timerContainer.querySelector("span");
      const verifySection = document.querySelector(".opti-verify-section");
      const qrImg = document.getElementById("payment-qr");
      const walletAddr = document.getElementById("wallet-address");
      const copyAddrBtn = document.getElementById("copy-address-btn");
      countdownInterval = setInterval(() => {
        time--;
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        if (timerDisplay)
          timerDisplay.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        if (time <= 0) {
          clearInterval(countdownInterval);
          clearInterval(autoPollInterval);
          timerContainer.innerHTML = '<i class="fas fa-ban"></i> Address Expired';
          timerContainer.style.color = "#f87171";
          if (qrImg) {
            qrImg.style.filter = "blur(6px)";
            qrImg.style.opacity = "0.5";
            qrImg.style.transition = "all 0.3s ease";
          }
          if (walletAddr) {
            walletAddr.style.filter = "blur(4px)";
            walletAddr.style.userSelect = "none";
            walletAddr.style.pointerEvents = "none";
          }
          const pa = document.getElementById("pay-amount");
          const cab = document.getElementById("copy-amount-btn");
          if (pa) {
            pa.style.filter = "blur(4px)";
            pa.style.userSelect = "none";
          }
          if (copyAddrBtn) {
            copyAddrBtn.style.pointerEvents = "none";
            copyAddrBtn.style.opacity = "0.4";
          }
          if (cab) {
            cab.style.pointerEvents = "none";
            cab.style.opacity = "0.4";
          }
          verifyMsg.style.display = "block";
          verifyMsg.style.color = "#f87171";
          verifyMsg.innerText =
            "This network address has expired. Funds sent here may be lost.";
          if (verifyBtn) verifyBtn.style.display = "none";
          let resetBtn = document.getElementById("reset-payment-btn");
          if (!resetBtn) {
            resetBtn = document.createElement("button");
            resetBtn.id = "reset-payment-btn";
            resetBtn.className = "opti-secondary-btn";
            resetBtn.style.marginTop = "10px";
            resetBtn.innerHTML =
              '<i class="fas fa-redo"></i> Generate New Address';
            verifySection.insertBefore(resetBtn, verifyMsg);
          }
          resetBtn.style.display = "block";
          resetBtn.onclick = async function () {
            resetExpiredUI();
            await executePaymentGeneration(true);
          };
        }
      }, 1000);
    }

    async function checkPaymentStatusSilent() {
      if (!currentPaymentId) return;
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "check_status",
            payment_id: currentPaymentId,
          }),
        });
        const data = await response.json();
        const status = data.payment_status;
        if (status === "finished" || status === "confirmed") {
          clearInterval(autoPollInterval);
          clearInterval(countdownInterval);
          showPhase("success");
        } else if (status === "partially_paid") {
          const remaining = data.actually_paid
            ? (data.pay_amount - data.actually_paid).toFixed(8)
            : "some amount";
          verifyMsg.style.display = "block";
          verifyMsg.innerText = `Partial payment detected! We received ${data.actually_paid}. Please send exactly ${remaining} to complete the order.`;
        }
      } catch (err) {}
    }

    function startAutoPolling() {
      clearInterval(autoPollInterval);
      autoPollInterval = setInterval(checkPaymentStatusSilent, 10000);
    }

    async function executePaymentGeneration(isRegeneration = false) {
      if (isProcessing) return;
      const now = Date.now();
      const fifteenMins = 15 * 60 * 1000;
      let genData = JSON.parse(localStorage.getItem("opti_sec_rate")) || {
        count: 0,
        firstStamp: now,
      };
      if (now - genData.firstStamp > fifteenMins)
        genData = { count: 0, firstStamp: now };
      if (genData.count >= 2) {
        let msgDiv = document.getElementById("cooldown-msg");
        if (!msgDiv) {
          msgDiv = document.createElement("div");
          msgDiv.id = "cooldown-msg";
          msgDiv.style.color = "#f87171";
          msgDiv.style.fontSize = "0.85rem";
          msgDiv.style.marginTop = "12px";
          msgDiv.style.textAlign = "center";
          msgDiv.style.fontWeight = "600";
          if (isRegeneration)
            document.querySelector(".opti-verify-section").appendChild(msgDiv);
          else generateBtn.parentNode.appendChild(msgDiv);
        }
        const timeLeft = Math.ceil(
          (fifteenMins - (now - genData.firstStamp)) / 60000,
        );
        msgDiv.innerHTML = `<i class="fas fa-shield-alt"></i> Security Lock: Limit reached. Try again in ${timeLeft} minutes.`;
        msgDiv.style.display = "block";
        setTimeout(() => {
          msgDiv.style.display = "none";
        }, 8000);
        return;
      }
      const clientName = nameInput.value.trim();
      const clientEmail = emailInput.value.trim();
      const nameValid = isValidFullName(clientName);
      const emailValid = isValidEmail(clientEmail);
      setFieldError(nameInput, nameError, !nameValid);
      setFieldError(emailInput, emailError, !emailValid);
      if (!nameValid || !emailValid) return;
      isProcessing = true;
      if (isRegeneration) {
        const rb = document.getElementById("reset-payment-btn");
        if (rb)
          rb.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
      } else {
        generateBtn.disabled = true;
        generateBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i><span>Processing...</span>';
      }
      const selectedCoin = selectElement.value;
      const priceText = document
        .querySelector(".checkout-total")
        .innerText.replace(/[^0-9.]/g, "");
      let dynamicPackName =
        document.querySelector(".checkout-header h1")?.innerText.toUpperCase() +
        " PACK";
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "create_payment",
            price_amount: parseFloat(priceText),
            pay_currency: selectedCoin,
            order_id: `${activeMarketer}|||${clientEmail}|||${clientName}`,
            order_description: dynamicPackName,
          }),
        });
        const data = await response.json();
        if (data.payment_id && data.pay_address) {
          genData.count++;
          localStorage.setItem("opti_sec_rate", JSON.stringify(genData));
          currentPaymentId = data.payment_id;
          resetExpiredUI();
          updatePaymentDetails(data, selectedCoin);
          showPhase("details");
          startCountdown();
          startAutoPolling();
        }
      } catch (error) {
        alert("Connection failed. Please check your connection.");
      } finally {
        isProcessing = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML =
          '<span>Generate Payment Address</span><i class="fas fa-bolt"></i>';
      }
    }

    function closeModal() {
      modal.classList.remove("active");
      document
        .querySelector(".opti-modal-content")
        .classList.remove("entrance-complete");
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
        if (qrImg) {
          qrImg.style.filter = "none";
          qrImg.style.opacity = "1";
        }
        const payAmount = document.getElementById("pay-amount");
        const copyAmtBtn = document.getElementById("copy-amount-btn");
        if (payAmount) payAmount.style.filter = "none";
        if (copyAmtBtn) {
          copyAmtBtn.style.pointerEvents = "auto";
          copyAmtBtn.style.opacity = "1";
        }
        const walletAddr = document.getElementById("wallet-address");
        if (walletAddr) {
          walletAddr.style.filter = "none";
          walletAddr.style.userSelect = "auto";
        }
        const copyAddrBtn = document.getElementById("copy-address-btn");
        if (copyAddrBtn) {
          copyAddrBtn.style.pointerEvents = "auto";
          copyAddrBtn.style.opacity = "1";
        }
        const timerContainer = document.getElementById("payment-timer");
        if (timerContainer) {
          timerContainer.innerHTML = "Price locked for: <span>20:00</span>";
          timerContainer.style.color = "";
        }
        currentPaymentId = "";
        clearInterval(countdownInterval);
        clearInterval(autoPollInterval);
      }, 300);
    }

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        modal.classList.add("active");
        showPhase("selection");
        setTimeout(() => {
          document
            .querySelector(".opti-modal-content")
            .classList.add("entrance-complete");
        }, 50);
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
    });
    if (nameInput)
      nameInput.addEventListener("input", () => {
        if (nameError.classList.contains("visible"))
          setFieldError(nameInput, nameError, !isValidFullName(nameInput.value));
      });
    if (emailInput)
      emailInput.addEventListener("input", () => {
        if (emailError.classList.contains("visible"))
          setFieldError(emailInput, emailError, !isValidEmail(emailInput.value));
      });
    if (generateBtn)
      generateBtn.addEventListener("click", () =>
        executePaymentGeneration(false),
      );
    const copyAmountBtn = document.getElementById("copy-amount-btn");
    if (copyAmountBtn)
      copyAmountBtn.addEventListener("click", async () => {
        const amountText = document
          .getElementById("pay-amount")
          .innerText.replace(/[^0-9.]/g, "");
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
    const copyBtnElement = document.getElementById("copy-address-btn");
    if (copyBtnElement)
      copyBtnElement.addEventListener("click", async () => {
        const addressText = document.getElementById("wallet-address").innerText;
        try {
          await navigator.clipboard.writeText(addressText);
          const originalHTML = copyBtnElement.innerHTML;
          copyBtnElement.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
          copyBtnElement.classList.add("copied");
          copyBtnElement.disabled = true;
          setTimeout(() => {
            copyBtnElement.innerHTML = originalHTML;
            copyBtnElement.classList.remove("copied");
            copyBtnElement.disabled = false;
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
    if (verifyBtn)
      verifyBtn.addEventListener("click", async () => {
        if (!currentPaymentId) return;
        verifyBtn.disabled = true;
        const originalHTML = verifyBtn.innerHTML;
        verifyBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Verifying on Blockchain...';
        verifyMsg.style.display = "block";
        verifyMsg.innerText =
          "Querying blockchain network. This may take a moment...";
        try {
          const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "check_status",
              payment_id: currentPaymentId,
            }),
          });
          const data = await response.json();
          const status = data.payment_status;
          if (status === "finished" || status === "confirmed") {
            verifyBtn.innerHTML =
              '<i class="fas fa-check-circle"></i> Payment Confirmed!';
            verifyMsg.style.display = "none";
            setTimeout(() => {
              showPhase("success");
            }, 1200);
          } else if (status === "partially_paid") {
            const remaining = data.actually_paid
              ? (data.pay_amount - data.actually_paid).toFixed(8)
              : "some amount";
            verifyMsg.innerText = `Partial payment received. Please send the remaining ${remaining} to complete the transaction.`;
            verifyBtn.innerHTML = originalHTML;
            verifyBtn.disabled = false;
          } else if (status === "sending" || status === "confirming") {
            verifyMsg.innerText =
              "Transaction detected and currently confirming on the network. Please check again in a moment.";
            verifyBtn.innerHTML = originalHTML;
            verifyBtn.disabled = false;
          } else if (status === "expired") {
            verifyMsg.innerText =
              "This payment address has expired. Please generate a new payment to continue.";
            verifyBtn.innerHTML = originalHTML;
            verifyBtn.disabled = false;
          } else {
            verifyMsg.innerText = `Status: ${(status || "pending").replace(/_/g, " ").toUpperCase()}. Awaiting network confirmation. Please try again shortly.`;
            verifyBtn.innerHTML = originalHTML;
            verifyBtn.disabled = false;
          }
        } catch (error) {
          verifyMsg.innerText =
            "Network error while verifying. Please check your connection and try again.";
          verifyBtn.innerHTML = originalHTML;
          verifyBtn.disabled = false;
        }
      });
  });
}

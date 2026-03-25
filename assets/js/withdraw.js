document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      ".psp-hero-text",
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
    );
    gsap.to(".login-card", {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.2,
    });
  } else {
    const card = document.querySelector(".login-card");
    const text = document.querySelector(".psp-hero-text");
    if (card) {
      card.style.opacity = "1";
      card.style.transform = "none";
    }
    if (text) {
      text.style.opacity = "1";
      text.style.transform = "none";
    }
  }

  const API_URL =
    "https://script.google.com/macros/s/AKfycbxqX2Zjv13GkMIR3BrPnt0Pe3JPuz6y1aJ6aS5uifruzfrmhan6KAEUl-lW2D6Q7vd-/exec";
  const ENROLL_WEBHOOK =
    "https://script.google.com/macros/s/AKfycbyck7pBRCWeseen7SkV4ntkgjRmZ4IepOOwWXq75pk3WbJQnFrVVTV-6FmBoyullnT4/exec";

  const els = {
    pid: document.getElementById("w_pid"),
    ppass: document.getElementById("w_ppass"),
    verifyBtn: document.getElementById("verifyBtn"),
    authError: document.getElementById("authError"),
    step1: document.getElementById("step1-auth"),
    step2: document.getElementById("step2-withdraw"),
    step3: document.getElementById("step3-success"),
    availableBalanceDisplay: document.getElementById("availableBalance"),
    emailInput: document.getElementById("w_email"),
    amountInput: document.getElementById("w_amount"),
    methodSelect: document.getElementById("w_method"),
    networkWrapper: document.getElementById("networkWrapper"),
    networkSelect: document.getElementById("w_network"),
    addressInput: document.getElementById("w_address"),
    submitBtn: document.getElementById("submitWithdrawBtn"),
    withdrawError: document.getElementById("withdrawError"),
    addressIcon: document.getElementById("addressIcon"),
  };

  const toggleWPass = document.getElementById("toggleWPass");
  if (toggleWPass && els.ppass) {
    toggleWPass.addEventListener("click", function () {
      const isPassword = els.ppass.getAttribute("type") === "password";
      els.ppass.setAttribute("type", isPassword ? "text" : "password");
      this.classList.remove("fa-eye", "fa-eye-slash");
      this.classList.add(isPassword ? "fa-eye" : "fa-eye-slash");
    });
  }

  let maxAvailableBalance = 0;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("pid")) {
    els.pid.value = urlParams.get("pid");
  }

  function updateSmartInfo() {
    const box = document.getElementById("smartInfoBox");
    const estTime = document.getElementById("estTime");
    const estFee = document.getElementById("estFee");
    const method = els.methodSelect.value;
    const network = els.networkSelect.value;

    if (!method) {
      if (box) box.style.display = "none";
      return;
    }

    if (box) {
      box.style.display = "block";
      if (typeof gsap !== "undefined" && box.style.opacity === "") {
        gsap.fromTo(
          box,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.3 },
        );
      }
    }

    if (method === "PayPal") {
      els.networkWrapper.style.display = "none";
      els.networkSelect.value = "";
      if (estTime) estTime.textContent = "24 - 48 Hours";
      if (estFee) estFee.textContent = "0% (Covered by OPTILINE)";
    } else if (method === "Crypto") {
      els.networkWrapper.style.display = "block";
      if (estTime) estTime.textContent = "1 - 2 Hours";

      if (network === "TRC20" || network === "Polygon" || network === "BEP20") {
        if (estFee) estFee.textContent = "~$1.00 USD";
      } else if (network === "ERC20") {
        if (estFee) estFee.textContent = "~$5.00 - $15.00 USD";
      } else {
        if (estFee) estFee.textContent = "Select Network";
      }
    }
    updateAddressIcon();
  }

  function updateAddressIcon() {
    const method = els.methodSelect.value;
    const icon = els.addressIcon;
    const addressInput = els.addressInput;

    if (method === "PayPal") {
      icon.className = "fas fa-envelope";
      addressInput.placeholder = "PayPal Email Address";
    } else if (method === "Crypto") {
      icon.className = "fas fa-coins";
      addressInput.placeholder = "USDT Wallet Address";
    } else {
      icon.className = "fas fa-map-marker-alt";
      addressInput.placeholder = "PayPal Email or Wallet Address";
    }
  }

  function addQuickAmountButtons() {
    const amountWrapper = els.amountInput.parentElement;
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "quick-amount-buttons";

    const amounts = [100, 250, 500, 1000];
    amounts.forEach((amt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-amount-btn";
      btn.textContent = `$${amt}`;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        els.amountInput.value = amt;
        validateAmount();
      });
      buttonsDiv.appendChild(btn);
    });

    amountWrapper.appendChild(buttonsDiv);
  }

  function validateAmount() {
    const amount = parseFloat(els.amountInput.value);

    if (isNaN(amount) || amount < 100) {
      els.amountInput.classList.add("error");
      return false;
    }

    if (amount > maxAvailableBalance) {
      els.amountInput.classList.add("error");
      return false;
    }

    els.amountInput.classList.remove("error");
    return true;
  }

  function addInputFocusEffects() {
    const inputs = document.querySelectorAll(
      ".input-wrapper input, .input-wrapper select",
    );

    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.parentElement.classList.add("focused");
      });

      input.addEventListener("blur", () => {
        input.parentElement.classList.remove("focused");
      });
    });
  }

  function validateCryptoAddress(method, network, address) {
    if (method === "PayPal") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
    } else if (method === "Crypto") {
      if (network === "TRC20") {
        return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
      } else if (
        network === "ERC20" ||
        network === "BEP20" ||
        network === "Polygon"
      ) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      }
    }
    return false;
  }

  function showLoadingState(button, isLoading) {
    const btnText = button.querySelector(".btn-txt");
    const btnIcon = button.querySelector("i:last-child");

    if (isLoading) {
      button.disabled = true;
      btnText.textContent = "Processing...";
      btnIcon.className = "fas fa-spinner fa-spin";
    } else {
      button.disabled = false;
      btnText.textContent =
        button.id === "verifyBtn"
          ? "Verify & Load Balance"
          : "Confirm Withdrawal";
      btnIcon.className =
        button.id === "verifyBtn" ? "fas fa-sync-alt" : "fas fa-check";
    }
  }

  function updateBalanceWithAnimation(newBalance) {
    const balanceEl = els.availableBalanceDisplay;
    const oldValue =
      parseFloat(balanceEl.textContent.replace(/[$,]/g, "")) || 0;

    if (typeof gsap !== "undefined") {
      const obj = { val: oldValue };
      gsap.to(obj, {
        val: newBalance,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          balanceEl.textContent = `$${obj.val.toFixed(2)}`;
        },
        onComplete: () => {
          balanceEl.textContent = `$${newBalance.toFixed(2)}`;
          balanceEl.classList.add("updated");
          setTimeout(() => balanceEl.classList.remove("updated"), 300);
        },
      });
    } else {
      balanceEl.textContent = `$${newBalance.toFixed(2)}`;
    }
  }

  els.methodSelect.addEventListener("change", updateSmartInfo);
  if (els.networkSelect)
    els.networkSelect.addEventListener("change", updateSmartInfo);

  els.verifyBtn.addEventListener("click", () => {
    const id = els.pid.value.trim();
    const pass = els.ppass.value.trim();

    if (!id || !pass) {
      showError(els.authError, "Please enter both Partner ID and Access Key.");
      return;
    }

    showLoadingState(els.verifyBtn, true);
    els.authError.style.display = "none";

    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "partner_login",
        partnerId: id,
        password: pass,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          calculateBalanceAndProceed(data.data);
        } else {
          showError(els.authError, "Invalid credentials.");
          showLoadingState(els.verifyBtn, false);
        }
      })
      .catch((err) => {
        showError(
          els.authError,
          "Connection failed. Please check your internet.",
        );
        showLoadingState(els.verifyBtn, false);
      });
  });

  function calculateBalanceAndProceed(data) {
    maxAvailableBalance =
      (parseFloat(data.commission) || 0) - (parseFloat(data.withdrawn) || 0);

    if (maxAvailableBalance < 100) {
      showError(
        els.authError,
        `Your available balance is $${maxAvailableBalance.toFixed(2)}. Minimum withdrawal is $100.`,
      );
      showLoadingState(els.verifyBtn, false);
      return;
    }

    updateBalanceWithAnimation(maxAvailableBalance);

    addQuickAmountButtons();
    addInputFocusEffects();

    if (typeof gsap !== "undefined") {
      gsap.to(els.step1, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        onComplete: () => {
          els.step1.style.display = "none";
          els.step2.style.display = "block";
          gsap.fromTo(
            els.step2,
            { opacity: 0, y: 20, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.2)",
            },
          );
        },
      });
    } else {
      els.step1.style.display = "none";
      els.step2.style.display = "block";
    }
  }

  els.submitBtn.addEventListener("click", async () => {
    const email = els.emailInput.value.trim();
    const amount = parseFloat(els.amountInput.value);
    const method = els.methodSelect.value;
    const network = els.networkSelect.value;
    const address = els.addressInput.value.trim();

    els.withdrawError.style.display = "none";
    els.withdrawError.textContent = "";

    if (!validateAmount()) {
      showError(els.withdrawError, "Please enter a valid amount (min $100).");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(els.withdrawError, "Please enter a valid email address.");
      els.emailInput.classList.add("error");
      return;
    }
    els.emailInput.classList.remove("error");

    if (!method) {
      showError(els.withdrawError, "Please select a payout method.");
      return;
    }

    if (method === "Crypto" && !network) {
      showError(els.withdrawError, "Please select a transfer network.");
      return;
    }

    if (!validateCryptoAddress(method, network, address)) {
      if (method === "PayPal") {
        showError(els.withdrawError, "Invalid PayPal email address.");
      } else {
        showError(
          els.withdrawError,
          `Invalid wallet address for ${network} network.`,
        );
      }
      els.addressInput.classList.add("error");
      return;
    }
    els.addressInput.classList.remove("error");

    const finalMethod = method === "Crypto" ? `USDT (${network})` : method;

    showLoadingState(els.submitBtn, true);

    try {
      const response = await fetch(ENROLL_WEBHOOK, {
        method: "POST",
        body: JSON.stringify({
          action: "withdraw_request",
          partnerId: els.pid.value.trim(),
          email: email,
          amount: amount,
          method: finalMethod,
          address: address,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      const activeSession = localStorage.getItem("optiline_psp_session");
      if (activeSession) {
        const parsed = JSON.parse(activeSession);
        parsed.lastActivity = Date.now();
        if (!parsed.data.withdrawn) parsed.data.withdrawn = 0;
        parsed.data.withdrawn += amount;
        if (!parsed.data.withdrawals) parsed.data.withdrawals = [];
        parsed.data.withdrawals.unshift({
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          amount: amount,
          method: finalMethod,
          status: "Pending",
        });
        localStorage.setItem("optiline_psp_session", JSON.stringify(parsed));
      }

      if (typeof gsap !== "undefined") {
        const loginCard = document.querySelector(".login-card");
        const cardTop =
          loginCard.getBoundingClientRect().top + window.scrollY - 100;

        gsap.to(els.step2, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          onComplete: () => {
            els.step2.style.display = "none";
            els.step3.style.display = "block";

            gsap.fromTo(
              els.step3,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
            );

            gsap.to(window, {
              duration: 0.8,
              scrollTo: { y: cardTop, autoKill: true },
              ease: "power2.inOut",
            });
          },
        });
      } else {
        els.step2.style.display = "none";
        els.step3.style.display = "block";

        const loginCard = document.querySelector(".login-card");
        if (loginCard) {
          setTimeout(() => {
            loginCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      }
    } catch (err) {
      showError(els.withdrawError, "Network error. Please try again later.");
      showLoadingState(els.submitBtn, false);
    }
  });

  function showError(element, msg) {
    element.textContent = msg;
    element.style.display = "block";
    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        element,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3 },
      );
    }
  }

  [els.pid, els.ppass].forEach((input) => {
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          els.verifyBtn.click();
        }
      });
    }
  });

  els.amountInput.addEventListener("input", validateAmount);
  els.amountInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      els.submitBtn.click();
    }
  });

  [els.emailInput, els.addressInput].forEach((input) => {
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          els.submitBtn.click();
        }
      });
    }
  });
});

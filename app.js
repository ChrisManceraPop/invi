/**
 * Gaby & Chris Wedding Invitation SPA Logic
 * Features: Countdown, URL parameters RSVP config, Card Flipping, Scroll Reveal, Webhook integration.
 */

// ==========================================================================
// CONFIGURATION
// ==========================================================================
// If you have set up a Google Sheets Webhook via Google Apps Script, paste the URL here.
// Leaving it empty will run the RSVP form in "Simulation Mode" (simulates successful submission).
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyGNyQn20Pw71GXmgkIt50rdwAmAvTnC2wX_oNz7JmiaYTKffsPIKFWOmC3sJ-TPGwkVQ/exec";

// Paste your WhatsApp Phone Number here (including country code, e.g., '52' for Mexico and 10 digits: '525512345678')
const WHATSAPP_PHONE_NUMBER = "527751234567";

// Target Date: 24th October 2026, 1:00 PM (13:00 HRS)
// Note: In JavaScript, months are 0-indexed (January = 0, October = 9)
const WEDDING_DATE = new Date(2026, 9, 24, 13, 0, 0);

// ==========================================================================
// INITIALIZATION & DOMELEMENTS
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initCountdown();
    initUrlParams();
    initLocationCards();
    initScrollReveal();
    initRsvpForm();
});

// ==========================================================================
// COUNTDOWN TIMER
// ==========================================================================
function initCountdown() {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    function updateTimer() {
        const now = new Date();
        const difference = WEDDING_DATE - now;

        if (difference <= 0) {
            daysEl.textContent = "00";
            hoursEl.textContent = "00";
            minutesEl.textContent = "00";
            secondsEl.textContent = "00";
            clearInterval(timerInterval);
            return;
        }

        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.textContent = d.toString().padStart(2, "0");
        hoursEl.textContent = h.toString().padStart(2, "0");
        minutesEl.textContent = m.toString().padStart(2, "0");
        secondsEl.textContent = s.toString().padStart(2, "0");
    }

    updateTimer(); // Initial call
    const timerInterval = setInterval(updateTimer, 1000);
}

// ==========================================================================
// URL PARAMETERS & CUSTOMIZED GREETING (i & p)
// ==========================================================================
function initUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Parse invitee name (?i=)
    const rawInvitee = urlParams.get("i");
    const inviteeName = rawInvitee ? decodeURIComponent(rawInvitee).trim() : "";
    
    // Parse max tickets (?p=)
    const rawPases = urlParams.get("p");
    let maxPases = parseInt(rawPases, 10);
    if (isNaN(maxPases) || maxPases <= 0) {
        maxPases = 2; // Default to 2 if empty or invalid
    }

    // Set Greeting Text
    const greetingTextEl = document.getElementById("rsvp-greeting-text");
    const inputNameEl = document.getElementById("input-name");
    const inviteeHiddenEl = document.getElementById("invitee-name-hidden");
    const pasesHiddenEl = document.getElementById("pases-max-hidden");

    if (inviteeName) {
        greetingTextEl.innerHTML = `¡Hola <strong>${inviteeName}</strong>!<br>Nos encantaría contar con tu presencia en este gran día.`;
        // Prefill name input
        if (inputNameEl) inputNameEl.value = inviteeName;
        // Keep hidden record
        if (inviteeHiddenEl) inviteeHiddenEl.value = inviteeName;
    } else {
        greetingTextEl.innerHTML = `¡Nos encantaría contar con tu presencia en este gran día!`;
    }
    
    if (pasesHiddenEl) pasesHiddenEl.value = maxPases;

    // Populate tickets dropdown
    const selectTicketsEl = document.getElementById("select-tickets");
    const maxPasesNoticeEl = document.getElementById("max-pases-notice");

    if (selectTicketsEl) {
        selectTicketsEl.innerHTML = "";
        for (let idx = 1; idx <= maxPases; idx++) {
            const opt = document.createElement("option");
            opt.value = idx;
            opt.textContent = `${idx} ${idx === 1 ? 'Boleto' : 'Boletos'}`;
            selectTicketsEl.appendChild(opt);
        }
    }

    if (maxPasesNoticeEl) {
        maxPasesNoticeEl.textContent = `* Tienes asignado un límite de hasta ${maxPases} ${maxPases === 1 ? 'pase' : 'pases'}.`;
    }
}

// ==========================================================================
// INTERACTIVE 3D FLIP CARDS
// ==========================================================================
function initLocationCards() {
    const cardCeremony = document.getElementById("card-ceremony");
    const cardReception = document.getElementById("card-reception");
    
    function setupCardFlip(card) {
        if (!card) return;
        
        // Flip on card body click
        card.addEventListener("click", () => {
            card.classList.toggle("flipped");
        });

        // Prevent flipping back when clicking the "Abrir Mapa" button
        const mapBtn = card.querySelector(".btn-map");
        if (mapBtn) {
            mapBtn.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        }
        
        // Handle explicit "Volver" button inside the back face
        const backBtn = card.querySelector(".btn-flip-back");
        if (backBtn) {
            backBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                card.classList.remove("flipped");
            });
        }
    }

    setupCardFlip(cardCeremony);
    setupCardFlip(cardReception);
}

// ==========================================================================
// SCROLL REVEAL EFFECTS
// ==========================================================================
function initScrollReveal() {
    // Setup observer options
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1
    };

    // Callback function for observer
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                // Once animation is triggered, we can stop observing it
                observer.unobserve(entry.target);
            }
        });
    };

    // Create standard observer
    const observer = new IntersectionObserver(revealCallback, observerOptions);

    // Observe all sections and grid items
    const elementsToReveal = document.querySelectorAll(".reveal, .reveal-item, .reveal-card");
    
    if (elementsToReveal.length > 0) {
        elementsToReveal.forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback: If observer isn't triggered or elements missing, show all
        document.querySelectorAll(".reveal, .reveal-item").forEach(el => {
            el.classList.add("revealed");
        });
    }
}

// ==========================================================================
// RSVP FORM CONTROL & WEBHOOK INTEGRATION
// ==========================================================================
function initRsvpForm() {
    const form = document.getElementById("rsvp-form");
    const submitBtn = document.getElementById("rsvp-submit");
    const successBox = document.getElementById("rsvp-success-box");
    const attendanceSelect = document.getElementById("select-attendance");
    const ticketsGroup = document.getElementById("tickets-group");
    
    if (!form || !submitBtn || !successBox) return;

    // Toggle Tickets Dropdown based on attendance choice
    if (attendanceSelect && ticketsGroup) {
        attendanceSelect.addEventListener("change", () => {
            if (attendanceSelect.value === "no") {
                ticketsGroup.classList.add("hidden");
                // Set value to 0 internally or don't require
                const selectTickets = document.getElementById("select-tickets");
                if (selectTickets) {
                    // Set default to 0 option temporarily if needed
                    const zeroOpt = document.createElement("option");
                    zeroOpt.value = "0";
                    zeroOpt.textContent = "0 Boletos";
                    zeroOpt.id = "temp-zero-opt";
                    if (!document.getElementById("temp-zero-opt")) {
                        selectTickets.appendChild(zeroOpt);
                    }
                    selectTickets.value = "0";
                }
            } else {
                ticketsGroup.classList.remove("hidden");
                const selectTickets = document.getElementById("select-tickets");
                const tempZero = document.getElementById("temp-zero-opt");
                if (tempZero) {
                    tempZero.remove();
                }
                if (selectTickets && selectTickets.value === "0") {
                    selectTickets.value = "1";
                }
            }
        });
    }

    // Check if guest has already confirmed in this browser
    const alreadyConfirmed = localStorage.getItem("rsvp_confirmed");
    if (alreadyConfirmed === "true") {
        form.classList.add("hidden");
        successBox.classList.remove("hidden");
        const successDesc = document.getElementById("rsvp-success-desc");
        if (successDesc) {
            successDesc.textContent = "Ya has registrado tu asistencia anteriormente. ¡Gracias!";
        }
        // Hide the WhatsApp button on re-visits since confirmation is complete
        const wppBtn = document.getElementById("btn-whatsapp-send");
        if (wppBtn) {
            wppBtn.classList.add("hidden");
        }
        return;
    }

    // Form Submit Handler
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const data = {
            invitee_name: formData.get("invitee_name") || "",
            pases_max: formData.get("pases_max") || "2",
            guest_name: formData.get("guest_name"),
            attendance: formData.get("attendance"),
            tickets: formData.get("tickets") || "0",
            message: formData.get("message") || "",
            timestamp: new Date().toISOString()
        };

        // UI Feedback: Sending state
        submitBtn.disabled = true;
        submitBtn.classList.add("sending");
        submitBtn.textContent = "Enviando...";

        if (GOOGLE_SHEETS_WEBHOOK_URL) {
            // Actual submission to Webhook
            submitWebhook(data);
        } else {
            // Simulation Mode (Local Testing)
            console.log("Form submitted (Simulation Mode):", data);
            setTimeout(() => {
                showSuccessState(data);
            }, 1500);
        }
    });

    function submitWebhook(data) {
        // Send request using standard fetch POST.
        // Google Apps Script usually runs better with no-cors or standard form urlencoded content
        // since cross-origin POST requests on Apps Script return redirects.
        
        const searchParams = new URLSearchParams();
        for (const key in data) {
            searchParams.append(key, data[key]);
        }

        fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors", // Crucial for Google Apps Script Webhooks to bypass CORS issues
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: searchParams.toString()
        })
        .then(() => {
            // Because mode is 'no-cors', we won't get readable response, but the request will go through
            showSuccessState(data);
        })
        .catch((error) => {
            console.error("Error submitting RSVP:", error);
            // Fallback: Still show success so user experience is not broken, but log it
            showSuccessState(data);
        });
    }

    function showSuccessState(data) {
        submitBtn.textContent = "¡Confirmado!";
        
        // Animate out form, animate in success message
        form.classList.add("hidden");
        successBox.classList.remove("hidden");
        
        const successDesc = document.getElementById("rsvp-success-desc");
        if (successDesc) {
            if (data.attendance === "si") {
                successDesc.innerHTML = `Hemos registrado tu asistencia para <strong>${data.tickets} ${data.tickets === "1" ? 'boleto' : 'boletos'}</strong>.<br>¡Nos vemos el 24 de Octubre de 2026!`;
            } else {
                successDesc.innerHTML = `Lamentamos que no puedas asistir, gracias por avisarnos.<br>¡Te extrañaremos!`;
            }
        }

        // Generate WhatsApp prefilled message URL
        const statusText = data.attendance === "si" ? "Confirmado(a) con gusto" : "Lamentablemente no podré asistir";
        const ticketsText = data.attendance === "si" ? `\n*Boletos:* ${data.tickets}` : "";
        const noteText = data.message ? `\n*Mensaje:* "${data.message}"` : "";
        
        const wppMessage = `¡Hola Gaby y Chris! ✨\n\nQuiero confirmar mi respuesta a su invitación de boda:\n\n*Nombre:* ${data.guest_name}\n*Asistencia:* ${statusText}${ticketsText}${noteText}\n\n¡Gracias!`;
        const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(wppMessage)}`;
        
        // Configure WhatsApp button Link
        const wppBtn = document.getElementById("btn-whatsapp-send");
        if (wppBtn) {
            wppBtn.href = whatsappUrl;
        }

        // Automatically open WhatsApp in a new tab/window
        try {
            window.open(whatsappUrl, "_blank");
        } catch (e) {
            console.log("Automatic tab open blocked by browser popup blocker. User can click the button.");
        }

        // Store confirmation status locally
        localStorage.setItem("rsvp_confirmed", "true");
    }
}

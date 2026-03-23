// ============================================
// DELIVERY CONTROLLER - Xử lý events giao thuốc
// ============================================

import deliveryService from "../services/deliveryService.js";
import patientService from "../services/patientService.js";
import { renderDeliveryView } from "../views/deliveryView.js";
import { showToast } from "../utils/ui.js";

class DeliveryController {
  constructor() {
    this.viewContainer = document.getElementById("view-delivery");
  }

  init() {
    // Render sẽ được gọi khi switch view
  }

  renderView() {
    const bins = deliveryService.getDeliveryBins();
    const patients = patientService.getPatients();
    const readyBinsCount = deliveryService.getReadyBinsCount();

    renderDeliveryView(this.viewContainer, bins, patients, readyBinsCount);

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    const patients = patientService.getPatients();
    const bins = deliveryService.getDeliveryBins();

    // Patient search controls - searchable autocomplete
    this.viewContainer.querySelectorAll(".delivery-control-patient-search").forEach((input) => {
      const index = Number(input.dataset.index);
      const hiddenInput = this.viewContainer.querySelector(`.delivery-control-patient-id[data-index="${index}"]`);
      const dropdown = this.viewContainer.querySelector(`.patient-dropdown-list[data-index="${index}"]`);
      
      // Restore previous patient selection
      const currentPatientId = bins[index].patientId;
      if (currentPatientId) {
        const patient = patients.find(p => String(p.id) === String(currentPatientId));
        if (patient) {
          input.value = patient.name;
          hiddenInput.value = currentPatientId;
        }
      }

      // Helper function to render patient list
      const renderPatientList = (patientsToShow) => {
        dropdown.innerHTML = "";

        if (patientsToShow.length === 0) {
          dropdown.innerHTML = '<div class="dropdown-no-result">Không tìm thấy bệnh nhân</div>';
          dropdown.classList.add("show");
          return;
        }

        patientsToShow.forEach((patient) => {
          const item = document.createElement("div");
          item.className = "dropdown-item";
          item.innerHTML = `<strong>${patient.name}</strong><span>Room ${patient.room}, Bed ${patient.bed}</span>`;
          
          item.addEventListener("click", () => {
            input.value = patient.name;
            hiddenInput.value = patient.id;
            dropdown.innerHTML = "";
            dropdown.classList.remove("show");
            deliveryService.updateBin(index, "patientId", patient.id);
            this.updateReadyState();
          });

          dropdown.appendChild(item);
        });

        dropdown.classList.add("show");
      };

      // Focus event - show all patients
      input.addEventListener("focus", () => {
        renderPatientList(patients);
      });

      // Input event for filtering
      input.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();

        if (searchTerm.length === 0) {
          renderPatientList(patients);
          return;
        }

        // Filter patients based on search term
        const filtered = patients.filter((p) =>
          p.name.toLowerCase().includes(searchTerm)
        );

        renderPatientList(filtered);
      });

      // Close dropdown on blur
      input.addEventListener("blur", () => {
        setTimeout(() => {
          dropdown.classList.remove("show");
        }, 200);
      });

      // Close dropdown on Escape key
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          dropdown.classList.remove("show");
        }
      });
    });

    // Note textarea controls
    this.viewContainer.querySelectorAll(".delivery-control-note").forEach((textarea) => {
      const index = Number(textarea.dataset.index);
      textarea.value = deliveryService.getDeliveryBins()[index].note || "";

      textarea.addEventListener("input", (e) => {
        deliveryService.updateBin(index, "note", e.target.value, false);
        this.updateReadyState();
      });
    });

    // Clear bin buttons
    this.viewContainer.querySelectorAll(".clear-bin-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        const result = deliveryService.clearBin(index);
        if (result.success) {
          showToast(result.message);
          this.renderView();
        } else {
          showToast(result.message);
        }
      });
    });

    // Start mission button
    const startBtn = this.viewContainer.querySelector("#start-delivery-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const result = deliveryService.startMission();
        if (result.success) {
          showToast(result.message);
          this.renderView();
        } else {
          showToast(result.message);
        }
      });
    }
  }

  updateReadyState() {
    const readyCount = deliveryService.getReadyBinsCount();
    const readyText = this.viewContainer.querySelector("#ready-bins-text");
    const startBtn = this.viewContainer.querySelector("#start-delivery-btn");

    if (readyText) {
      readyText.textContent = `${readyCount} ngăn đã sẵn sàng`;
    }

    if (startBtn) {
      startBtn.disabled = !readyCount;
    }
  }
}

export default new DeliveryController();

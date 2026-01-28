// src/utils/dialogs.ts
export type ConfirmIconType =
  | "question"
  | "warning"
  | "danger"
  | "info"
  | "success";

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: ConfirmIconType;
  showCloseButton?: boolean;
  persistent?: boolean;
}

export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  icon?: ConfirmIconType;
}

// Icon component definitions
const IconTemplates = {
  question: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `,
  warning: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
    </svg>
  `,
  danger: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
    </svg>
  `,
  info: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `,
  success: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `,
};

const IconColors: Record<ConfirmIconType, string> = {
  question: "text-blue-600 bg-blue-100",
  warning: "text-yellow-600 bg-yellow-100",
  danger: "text-red-600 bg-red-100",
  info: "text-blue-600 bg-blue-100",
  success: "text-green-600 bg-green-100",
};

class DialogManager {
  private static instance: DialogManager;
  private container: HTMLDivElement | null = null;
  private activeDialogs: Set<HTMLDivElement> = new Set();

  private constructor() {
    this.injectGlobalStyles();
  }

  static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager();
    }
    return DialogManager.instance;
  }

  private injectGlobalStyles(): void {
    if (document.getElementById("dialog-styles")) return;

    const styles = document.createElement("style");
    styles.id = "dialog-styles";
    styles.textContent = `
      /* Windows-friendly dialog styles */
      .dialog-backdrop {
        background-color: rgba(0, 0, 0, 0.5);
        transition: opacity 150ms ease-out;
      }
      
      /* Windows-like animation */
      .dialog-enter {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      
      .dialog-enter-active {
        opacity: 1;
        transform: translateY(0) scale(1);
        transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1), 
                    transform 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      
      .dialog-exit {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      
      .dialog-exit-active {
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
        transition: opacity 150ms cubic-bezier(0.2, 0, 0, 1), 
                    transform 150ms cubic-bezier(0.2, 0, 0, 1);
      }
      
      /* Backdrop animation */
      .backdrop-enter {
        opacity: 0;
      }
      
      .backdrop-enter-active {
        opacity: 1;
        transition: opacity 150ms ease-out;
      }
      
      .backdrop-exit {
        opacity: 1;
      }
      
      .backdrop-exit-active {
        opacity: 0;
        transition: opacity 150ms ease-in;
      }

      /* Windows-style button hover effects */
      .windows-btn {
        position: relative;
        transition: all 100ms ease;
        border: 2px solid transparent;
      }

      .windows-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .windows-btn:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .windows-btn:focus {
        outline: 2px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
      }

      /* Windows-style typography */
      .windows-title {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        font-weight: 600;
        letter-spacing: -0.025em;
      }

      .windows-text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        line-height: 1.5;
      }

      /* Scrollbar styling for Windows */
      .dialog-scrollbar::-webkit-scrollbar {
        width: 8px;
      }

      .dialog-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      .dialog-scrollbar::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      .dialog-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;
    document.head.appendChild(styles);
  }

  private createContainer(): void {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.id = "dialog-container";
    this.container.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none";
    document.body.appendChild(this.container);
  }

  private createBackdrop(): HTMLDivElement {
    const backdrop = document.createElement("div");
    backdrop.className =
      "fixed inset-0 bg-black/50 dialog-backdrop backdrop-enter pointer-events-auto";
    return backdrop;
  }

  private createDialogElement(): HTMLDivElement {
    const dialog = document.createElement("div");
    dialog.className = `
      bg-white rounded-lg shadow-2xl
      w-full max-w-md
      overflow-hidden
      transform transition-all duration-200
      pointer-events-auto
      border border-gray-300
      dialog-enter
    `;
    return dialog;
  }

  private animateIn(element: HTMLElement): void {
    requestAnimationFrame(() => {
      element.classList.remove("dialog-enter");
      element.classList.add("dialog-enter-active");
    });
  }

  private animateOut(element: HTMLElement, callback: () => void): void {
    element.classList.remove("dialog-enter-active");
    element.classList.add("dialog-exit", "dialog-exit-active");

    setTimeout(() => {
      callback();
    }, 150);
  }

  private getIconMarkup(iconType: ConfirmIconType): string {
    const colorClasses = IconColors[iconType];
    return `
      <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}">
        ${IconTemplates[iconType]}
      </div>
    `;
  }

  public showConfirm(options: ConfirmOptions = {}): Promise<boolean> {
    this.createContainer();

    return new Promise((resolve) => {
      const {
        title = "Are you sure?",
        message = "This action cannot be undone.",
        confirmText = "Confirm",
        cancelText = "Cancel",
        icon = "question",
        showCloseButton = true,
        persistent = false,
      } = options;

      const backdrop = this.createBackdrop();
      const dialog = this.createDialogElement();

      // Sanitize and format message
      const formattedMessage = this.formatDialogMessage(message);

      dialog.innerHTML = `
        <div class="p-5 flex items-start gap-4">
          ${this.getIconMarkup(icon)}
          <div class="flex-1 min-w-0">
            <h3 class="windows-title text-lg font-semibold text-gray-900 mb-2">
              ${title}
            </h3>
            <div class="windows-text text-sm text-gray-700 dialog-scrollbar max-h-64 overflow-y-auto">
              ${formattedMessage}
            </div>
          </div>
          ${
            showCloseButton
              ? `
            <button type="button" class="close-btn flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          `
              : ""
          }
        </div>
        <div class="px-5 py-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-200">
          <button type="button" class="
            cancel-btn
            windows-btn
            px-4 py-2 text-sm font-medium
            text-gray-700 bg-gray-100 hover:bg-gray-200
            rounded
            border border-gray-300
          ">
            ${cancelText}
          </button>
          <button type="button" class="
            confirm-btn
            windows-btn
            px-4 py-2 text-sm font-medium
            bg-[#0E9D7C] hover:bg-[#0d8c6f]
            text-white
            rounded
          ">
            ${confirmText}
          </button>
        </div>
      `;

      // Append to container
      this.container!.appendChild(backdrop);
      this.container!.appendChild(dialog);
      this.activeDialogs.add(dialog);

      // Animate in backdrop first
      requestAnimationFrame(() => {
        backdrop.classList.remove("backdrop-enter");
        backdrop.classList.add("backdrop-enter-active");
      });

      // Animate in dialog
      setTimeout(() => {
        this.animateIn(dialog);
      }, 50);

      // Event handlers
      const cleanup = () => {
        // Animate out backdrop
        backdrop.classList.remove("backdrop-enter-active");
        backdrop.classList.add("backdrop-exit-active");

        // Animate out dialog
        this.animateOut(dialog, () => {
          dialog.remove();
          backdrop.remove();
          this.activeDialogs.delete(dialog);

          if (this.container && this.activeDialogs.size === 0) {
            this.container.remove();
            this.container = null;
          }
        });
      };

      const onConfirm = () => {
        if (!persistent) {
          cleanup();
        }
        resolve(true);
      };

      const onCancel = () => {
        if (!persistent) {
          cleanup();
        }
        resolve(false);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !persistent) {
          onCancel();
        } else if (e.key === "Enter") {
          onConfirm();
        }
      };

      // Add event listeners
      const confirmBtn = dialog.querySelector<HTMLButtonElement>(".confirm-btn")!;
      const cancelBtn = dialog.querySelector<HTMLButtonElement>(".cancel-btn")!;

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);

      if (showCloseButton) {
        dialog
          .querySelector<HTMLButtonElement>(".close-btn")!
          .addEventListener("click", onCancel);
      }

      backdrop.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKeyDown);

      // Focus the confirm button for accessibility
      setTimeout(() => {
        confirmBtn.focus();
      }, 200);
    });
  }

  private formatDialogMessage(message: string): string {
    // Convert newlines to <br> and handle basic HTML
    return message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;(\/?)(br|strong|em|b|i|u|span|div|p|ul|ol|li|code|pre)&gt;/gi, '<$1$2>')
      .replace(/\n/g, '<br>')
      .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
      .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>');
  }

  public showAlert(options: AlertOptions): Promise<void> {
    this.createContainer();

    return new Promise((resolve) => {
      const {
        title = "Information",
        message,
        buttonText = "OK",
        icon = "info",
      } = options;

      const backdrop = this.createBackdrop();
      const dialog = this.createDialogElement();

      // Format message with proper HTML
      const formattedMessage = this.formatDialogMessage(message);

      dialog.innerHTML = `
        <div class="p-5 flex items-start gap-4">
          ${this.getIconMarkup(icon)}
          <div class="flex-1 min-w-0">
            <h3 class="windows-title text-lg font-semibold text-gray-900 mb-3">
              ${title}
            </h3>
            <div class="windows-text text-sm text-gray-700 dialog-scrollbar max-h-96 overflow-y-auto">
              ${formattedMessage}
            </div>
          </div>
        </div>
        <div class="px-5 py-4 bg-gray-50 flex justify-end border-t border-gray-200">
          <button type="button" class="
            alert-btn
            windows-btn
            px-4 py-2 text-sm font-medium
            bg-[#0E9D7C] hover:bg-[#0d8c6f]
            text-white
            rounded
          ">
            ${buttonText}
          </button>
        </div>
      `;

      // Append to container
      this.container!.appendChild(backdrop);
      this.container!.appendChild(dialog);
      this.activeDialogs.add(dialog);

      // Animate in backdrop first
      requestAnimationFrame(() => {
        backdrop.classList.remove("backdrop-enter");
        backdrop.classList.add("backdrop-enter-active");
      });

      // Animate in dialog
      setTimeout(() => {
        this.animateIn(dialog);
      }, 50);

      // Event handlers
      const cleanup = () => {
        // Animate out backdrop
        backdrop.classList.remove("backdrop-enter-active");
        backdrop.classList.add("backdrop-exit", "backdrop-exit-active");

        // Animate out dialog
        this.animateOut(dialog, () => {
          dialog.remove();
          backdrop.remove();
          this.activeDialogs.delete(dialog);

          if (this.container && this.activeDialogs.size === 0) {
            this.container.remove();
            this.container = null;
          }
        });
      };

      const onConfirm = () => {
        cleanup();
        resolve();
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === "Enter") {
          onConfirm();
        }
      };

      // Add event listeners
      const alertBtn = dialog.querySelector<HTMLButtonElement>(".alert-btn")!;
      alertBtn.addEventListener("click", onConfirm);
      backdrop.addEventListener("click", onConfirm);
      document.addEventListener("keydown", onKeyDown);

      // Focus the button for accessibility
      setTimeout(() => {
        alertBtn.focus();
      }, 200);
    });
  }

  public closeAllDialogs(): void {
    this.activeDialogs.forEach((dialog) => {
      dialog.remove();
    });
    this.activeDialogs.clear();

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Create singleton instance
const dialogManager = DialogManager.getInstance();

// Export public API
export const showConfirm = (options?: ConfirmOptions): Promise<boolean> => {
  return dialogManager.showConfirm(options);
};

export const showAlert = (options: AlertOptions): Promise<void> => {
  return dialogManager.showAlert(options);
};

export const closeAllDialogs = (): void => {
  dialogManager.closeAllDialogs();
};

// Convenience functions for common dialog types
export const dialogs = {
  confirm: showConfirm,
  alert: showAlert,
  closeAll: closeAllDialogs,

  // Pre-configured dialogs
  delete: (itemName?: string) =>
    showConfirm({
      title: "Delete Confirmation",
      message: itemName
        ? `Are you sure you want to delete <strong>"${itemName}"</strong>?<br><br>This action cannot be undone.`
        : "Are you sure you want to delete this item?<br><br>This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      icon: "danger",
    }),

  success: (message: string, title: string = "Success!") =>
    showAlert({
      title,
      message,
      icon: "success",
    }),

  error: (message: string, title: string = "Error") =>
    showAlert({
      title,
      message,
      icon: "danger",
    }),

  warning: (message: string, title: string = "Warning") =>
    showAlert({
      title,
      message,
      icon: "warning",
    }),

  info: (message: string, title: string = "Information") =>
    showAlert({
      title,
      message,
      icon: "info",
    }),

  // Windows-style confirmation
  windowsConfirm: (title: string, message: string) =>
    showConfirm({
      title,
      message,
      confirmText: "Yes",
      cancelText: "No",
      icon: "question",
    }),

  // Windows-style alert
  windowsAlert: (title: string, message: string) =>
    showAlert({
      title,
      message,
      buttonText: "OK",
      icon: "info",
    }),
};
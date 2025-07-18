/**
 * HARDEM Editor - Sistema de Autenticação JavaScript
 */

class HardemAuth {
    constructor() {
        this.isAuthenticated = false;
        this.userInfo = null;
        this.loginModal = null;
        
        this.init();
    }
    
    init() {
        this.createLoginModal();
        this.checkAuthentication();
    }
    
    async checkAuthentication() {
        try {
            const response = await fetch("auth.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "action=check"
            });
            
            const data = await response.json();
            
            if (data.authenticated) {
                this.isAuthenticated = true;
                this.userInfo = data.user;
                this.initEditor();
            } else {
                this.showLoginModal();
            }
        } catch (error) {
            this.showLoginModal();
        }
    }
    
    async login(username, password) {
        try {
            const response = await fetch("auth.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.isAuthenticated = true;
                this.userInfo = data.user;
                this.hideLoginModal();
                this.initEditor();
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: "Erro de conexão" };
        }
    }
    
    async logout() {
        try {
            await fetch("auth.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "action=logout"
            });
            
            this.isAuthenticated = false;
            this.userInfo = null;
            this.disableEditor();
            this.showLoginModal();
            
        } catch (error) {
        }
    }
    
    createLoginModal() {
        const modalHTML = `
            <div id="hardem-login-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); display: none; z-index: 10000;
                justify-content: center; align-items: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white; padding: 40px; border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 400px;
                    max-width: 90vw; text-align: center;
                ">
                    <h2 style="color: #2c3e50; margin: 0 0 30px 0; font-size: 28px;">
                         HARDEM Editor
                    </h2>
                    <p style="color: #7f8c8d; margin: 0 0 30px 0;">Acesso Administrativo</p>
                    
                    <form id="hardem-login-form" style="text-align: left;">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500;">
                                Usuário:
                            </label>
                            <input type="text" id="hardem-username" required style="
                                width: 100%; padding: 12px; border: 2px solid #e1e8ed;
                                border-radius: 8px; font-size: 16px; box-sizing: border-box;
                            " placeholder="Digite seu usuário">
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500;">
                                Senha:
                            </label>
                            <input type="password" id="hardem-password" required style="
                                width: 100%; padding: 12px; border: 2px solid #e1e8ed;
                                border-radius: 8px; font-size: 16px; box-sizing: border-box;
                            " placeholder="Digite sua senha">
                        </div>
                        
                        <button type="submit" id="hardem-login-btn" style="
                            width: 100%; padding: 14px; background: #3498db;
                            color: white; border: none; border-radius: 8px;
                            font-size: 16px; font-weight: 600; cursor: pointer;
                        ">Entrar</button>
                        
                        <div id="hardem-login-message" style="
                            margin-top: 15px; padding: 10px; border-radius: 6px;
                            font-size: 14px; display: none; text-align: center;
                        "></div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        this.loginModal = document.getElementById("hardem-login-modal");
        this.setupLoginEvents();
    }
    
    setupLoginEvents() {
        const form = document.getElementById("hardem-login-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const username = document.getElementById("hardem-username").value.trim();
            const password = document.getElementById("hardem-password").value;
            
            if (!username || !password) {
                this.showLoginMessage("Preencha todos os campos", "error");
                return;
            }
            
            const btn = document.getElementById("hardem-login-btn");
            btn.textContent = "Entrando...";
            btn.disabled = true;
            
            const result = await this.login(username, password);
            
            if (result.success) {
                this.showLoginMessage(result.message, "success");
            } else {
                this.showLoginMessage(result.message, "error");
                document.getElementById("hardem-password").value = "";
            }
            
            btn.textContent = "Entrar";
            btn.disabled = false;
        });
    }
    
    showLoginMessage(message, type) {
        const messageDiv = document.getElementById("hardem-login-message");
        messageDiv.textContent = message;
        messageDiv.style.display = "block";
        
        if (type === "success") {
            messageDiv.style.background = "#d4edda";
            messageDiv.style.color = "#155724";
        } else {
            messageDiv.style.background = "#f8d7da";
            messageDiv.style.color = "#721c24";
        }
    }
    
    showLoginModal() {
        if (this.loginModal) {
            this.loginModal.style.display = "flex";
            document.getElementById("hardem-username").focus();
        }
    }
    
    hideLoginModal() {
        if (this.loginModal) {
            this.loginModal.style.display = "none";
        }
    }
    
    initEditor() {
        
        if (window.hardemEditor) {
            if (!window.hardemEditor.editMode) {
                window.hardemEditor.toggleEditMode();
            }
        } else {
            const checkEditor = setInterval(() => {
                if (window.hardemEditor) {
                    clearInterval(checkEditor);
                    if (!window.hardemEditor.editMode) {
                        window.hardemEditor.toggleEditMode();
                    }
                }
            }, 100);
        }
        
        this.addLogoutButton();
    }
    
    disableEditor() {
        if (window.hardemEditor && window.hardemEditor.editMode) {
            window.hardemEditor.toggleEditMode();
        }
        this.removeLogoutButton();
    }
    
    addLogoutButton() {
        this.removeLogoutButton();
        
        const logoutBtn = document.createElement("div");
        logoutBtn.id = "hardem-logout-btn";
        logoutBtn.innerHTML = `
            <div style="
                position: fixed; top: 20px; right: 20px;
                background: #e74c3c; color: white; padding: 12px 20px;
                border-radius: 25px; cursor: pointer; font-size: 14px;
                font-weight: 600; z-index: 9999;
            ">
                 ${this.userInfo.username} |  Sair
            </div>
        `;
        
        logoutBtn.addEventListener("click", () => {
            if (confirm("Deseja sair do modo de edição?")) {
                this.logout();
            }
        });
        
        document.body.appendChild(logoutBtn);
    }
    
    removeLogoutButton() {
        const btn = document.getElementById("hardem-logout-btn");
        if (btn) btn.remove();
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    window.hardemAuth = new HardemAuth();
});

window.HardemAuth = HardemAuth;

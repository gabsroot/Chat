class Login {
    constructor() {
        this.listen();
    }
    
    listen() {
        $(`#username`).on(`input`, function() {
            $(this).val($(this).val().toLowerCase().replace(/[^a-z0-9_]/g, ``));
        });
        
        $(`#username, #password`).on(`input`, function(event) {
            this.validate(`#${event.target.id}`);
        }.bind(this));
        
        $(`button`).on(`click`, function(event) {
            event.preventDefault();
            this.submit();
        }.bind(this));
        
        $(document).on(`contextmenu`, function(event) {
            event.preventDefault();
        });
    }
    
    validate(selector) {
        let value = $(selector).val().trim();
        let feedback = $(selector).siblings(`.invalid-warn`);

        if (!value) {
            $(selector).addClass(`is-invalid`).removeClass(`is-valid`);
            feedback.text(`This field is required.`).show();
            $(selector).focus();
            return false;
        }

        $(selector).removeClass(`is-invalid`).addClass(`is-valid`);
        feedback.hide();
        return true;
    }
    
    submit() {
        if (this.validate(`#username`) && this.validate(`#password`)) {
            $(`button`).html(`<span class="spinner"></span>`);
            
            $.ajax({
                url: `/login`,
                type: `POST`,
                contentType: `application/json`,
                data: JSON.stringify({
                    username: $(`#username`).val(),
                    password: $(`#password`).val()
                }),
                success: (response) => this.response(response),
                error: (xhr, status, error) => {
                    this.toast(`Connection error. Try again!`);
                    $(`button`).html(`Sign in`);
                }
            });
        }
    }
    
    response(response) {
        if (response.code != 200) {
            this.toast(`Incorrect username or password!`);
            $(`button`).html(`Sign in`);
            return;
        }

        localStorage.setItem(`username`, $(`#username`).val());

        gsap.to(`.container`, {
            opacity: 0,
            duration: 1,
            delay: 1,
            onComplete: () => {
                $(`.container`).hide();
                window.location.replace(`/chat`);
            }
        });
    }

    toast(message) {
        let toast = $(`<div>`).addClass(`toast`).text(message);
        $(`.toast-container`).append(toast);

        gsap.to(toast[0], {
            duration: 0.5,
            opacity: 1,
            scale: 1,
            y: 0,
            pointerEvents: `all`,
            ease: `power3.out`
        });

        setTimeout(() => {
            gsap.to(toast[0], {
                duration: 0.5,
                opacity: 0,
                scale: 0.9,
                y: 30,
                pointerEvents: `none`,
                ease: `power3.in`,
                onComplete: () => {
                    toast.remove();
                }
            });
        }, 3000);
    }
}


$(document).ready(function() {
    const login = new Login();
});

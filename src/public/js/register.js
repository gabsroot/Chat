class Register {
    constructor() {
        this.steps = {
            1: { title: `Create an account`, description: `Welcome new user` },
            2: { title: `Details`, description: `Enter your details` },
            3: { title: `Almost there`, description: `Upload your profile picture` }
        };
        
        this.step = 1;
        this.validator = new Validator();
        this.ui = new UI(this.steps);
        this.api = new API();
        
        this.listen();
    }
    
    listen() {
        $(`.steps .step`).on(`click`, (event) => {
            let step = parseInt($(event.currentTarget).attr(`data-step`));

            if (step < this.step) {
                this.change_step(step);
            }
        });
        
        $(`button`).on(`click`, (event) => this.button(event));

        $(`#username`).on(`input`, () => {
            this.validator.input(`#username`);
            this.validator.mask(`#username`);
        });

        $(`#password`).on(`input`, () => this.validator.input(`#password`));
        $(`#name`).on(`input`, () => this.validator.input(`#name`));
        $(`#bio`).on(`input`, () => this.validator.input(`#bio`));
        $(`.step-3 img`).on(`click`, () => $(`.step-3 input`).click());
        $(`.step-3 input`).on(`change`, (event) => this.image_upload(event));
        
        // right click
        $(document).on(`contextmenu`, (event) => event.preventDefault());
    }
    
    button(event) {
        event.preventDefault();
        
        if (this.step === 1 && this.validator.input(`#username`) && this.validator.input(`#password`)) {
            this.change_step(this.step + 1);
        }

        else if (this.step === 2 && this.validator.input(`#name`) && this.validator.input(`#bio`)) {
            this.change_step(this.step + 1);
        }
        
        else if (this.step === 3) {
            this.submit();
        }
    }
    
    submit() {
        $(`button`).html(`<span class="spinner"></span>`);
        
        let data = new FormData();
        data.append(`username`, $(`#username`).val());
        data.append(`password`, $(`#password`).val());
        data.append(`name`, $(`#name`).val());
        data.append(`bio`, $(`#bio`).val());
        data.append(`image`, $(`#image`)[0].files[0]);
        
        this.api.register(data, (response) => {
            if (!response) {
                window.location.replace(`/register`);
                return;
            }
            
            localStorage.setItem(`username`, $(`#username`).val());
            this.ui.welcome();
        });
    }
    
    change_step(step) {
        this.ui.anim_step(this.step, step);
        this.step = step;
    }
    
    image_upload(event) {
        let file = event.target.files[0];

        if (file) {
            $(`.step-3 img`).attr(`src`, URL.createObjectURL(file));
        }
    }
}

class Validator {

    input(selector) {
        let $field = $(selector);
        let value = $field.val().trim();
        let $feedback = $field.siblings(`.invalid-warn`);
        let valid = true;
        
        $field.removeClass(`is-invalid`).addClass(`is-valid`);
        $feedback.hide();
        
        if (!value) {
            $field.addClass(`is-invalid`).removeClass(`is-valid`);
            $feedback.text(`This field is required.`).show();
            $field.focus();
            return false;
        }
        
        if (selector === `#username`) {
            valid = this.username(value, $field, $feedback);
        }
        
        return valid;
    }
    
    username(value, $field, $feedback) {
        let available = false;
        
        $.ajax({
            url: `/user/` + value,
            type: `GET`,
            dataType: `json`,
            async: false,
            success: function(response) {
                available = response.available;
                
                if (!available) {
                    $field.addClass(`is-invalid`).removeClass(`is-valid`);
                    $feedback.text(`Username is already taken.`).show();
                    $field.focus();
                }
            }
        });
        
        return available;
    }
    
    mask(selector) {
        $(selector).val($(selector).val().toLowerCase().replace(/[^a-z0-9_]/g, ``));
    }
}

class UI {

    constructor(steps) {
        this.steps = steps;
        $(`.steps .step[data-step="1"]`).addClass(`active`);
    }
    
    anim_step(step, _id) {
        gsap.to(`.step-${step}`, { 
            opacity: 0, 
            duration: 0.2, 
            onComplete: () => {
                $(`.step-${step}`).hide();
                $(`.steps .step[data-step="${step}"]`).removeClass(`active`);
                $(`.step-${_id}`).css(`display`, _id === 3 ? `flex` : `block`);
                
                gsap.fromTo(`.step-${_id}`, 
                    { opacity: 0 }, 
                    { opacity: 1, duration: 0.2 }
                );
                
                $(`.steps .step[data-step="${_id}"]`).addClass(`active`);
                $(`#step-title`).text(this.steps[_id].title);
                $(`#step-description`).text(this.steps[_id].description);
                
                if (_id === 3) {
                    $(`button`).text(`Create account`);
                } else {
                    $(`button`).text(`Continue`);
                }
            }
        });
    }
    
    welcome() {
        gsap.to(`.container`, {
            opacity: 0,
            duration: 2,
            delay: 2,
            onComplete: () => {
                $(`.container`).hide();
                $(`.welcome`).show();
                
                gsap.from(`.welcome`, {
                    opacity: 0,
                    y: 50,
                    duration: 2,
                    ease: `power4.out`,
                    delay: 2
                });
                
                gsap.to(`.welcome`, {
                    opacity: 0,
                    duration: 1,
                    ease: `power4.in`,
                    delay: 5,
                    onComplete: () => {
                        $(`.welcome`).hide();
                        window.location.replace(`/chat`);
                    }
                });
            }
        });
    }
}

class API {
    register(data, callback) {
        $.ajax({
            url: `/register`,
            type: `POST`,
            data: data,
            processData: false,
            contentType: false,
            success: function(response) {
                callback(response);
            }
        });
    }
}


$(document).ready(() => {
    const register = new Register();
});

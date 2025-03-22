class Chat {
    constructor() {
        this.socket = io.connect();
        this.username = ``;
        this.selected = ``;
        this.show = false;
        this.online = {};

        this.ui = new UI(this);
        this.message = new Message(this);
        this.contact = new Contact(this);
        this.typing = new Typing(this);

        this.init();
    }
    
    init() {
        this.register();
        this.socket_events();
        this.listen();
        this.ui.anim();
        this.contact.load_last_messages();
    }
    
    register() {
        let username = localStorage.getItem(`username`);

        if (username) {
            this.username = username;
            this.socket.emit(`register`, username);
            this.socket.emit(`get_online_users`);
        }
    }
    
    socket_events() {
        this.socket.on(`receive_message`, (data) => {
            this.message.received(data);
        });
        
        this.socket.on(`user_status`, (data) => {
            this.contact.set_status(data);
        });
        
        this.socket.on(`online`, (users) => {
            this.contact.set_all_status(users);
        });
        
        this.socket.on(`user_typing`, (data) => {
            this.typing.refresh(data);
        });
    }
    
    listen() {
        $(`.contact`).on(`click`, (e) => {
            this.contact.click($(e.currentTarget));
        });
        
        $(`#send`).on(`click`, () => {
            this.message.send();
        });
        
        $(`#message`).on(`keydown`, (event) => {
            if (event.key === `Enter`) {
                this.message.send();
                this.typing.clear();
            }
        });
        
        $(`#message`).on(`input`, () => {
            this.typing.handler();
        });
        
        $(`#message`).on(`blur`, () => {
            this.typing.blur();
        });
        
        $(`.search input`).on(`input`, (e) => {
            this.ui.search($(e.currentTarget).val());
        });
        
        $(`.search .bx-x`).on(`click`, () => {
            this.ui.clear_search();
        });
        
        // right click
        $(document).on(`contextmenu`, (event) => {
            event.preventDefault();
        });
    }
    
    select_contact(username) {
        this.selected = username;
    }
    
    open_chat() {
        if (!this.show) {
            $(`.conversation`).css(`display`, `block`);
            this.show = true;
        }
    }
}

class UI {
    constructor(app) {
        this.app = app;
    }
    
    anim() {
        gsap.to(`.container`, {
            opacity: 2,
            duration: 2,
            delay: 1,
            ease: `power4.out`
        });
    }
    
    update_header(info, online) {
        $(`.conversation .top img`).attr(`src`, info.image);
        $(`.conversation .top .info h4`).text(info.name);
        $(`.conversation .top .info p`).text(online ? `online` : `offline`);
    }
    
    add_message(message, self) {
        $(`.conversation .center`).append(
            $(`<div class="message"></div>`).append(
                $(`<div></div>`).addClass(self ? `me` : `other`).text(message)
            )
        );

        this.scroll();
    }

    clear() {
        $(`.conversation .center`).empty();
    }
    
    search(filter) {
        filter = filter.toLowerCase();
        
        $(`.search .bx-x`).toggle(filter.length > 0);
        
        $(`.contact`).each(function() {
            let name = $(this).find(`h4`).text().toLowerCase();
            $(this).toggle(name.includes(filter));
        });
    }
    
    clear_search() {
        $(`.search input`).val(``).trigger(`input`);
    }

    scroll() {
        $(`.conversation .center`).scrollTop($(`.conversation .center`)[0].scrollHeight);
    }
}

class Message {
    constructor(app) {
        this.app = app;
    }
    
    send() {
        let message = $(`#message`).val();
        
        if (!this.app.selected || !message.trim()) {
            return;
        }
        
        $(`#message`).val(``);
        
        this.app.ui.add_message(message, true);
        this.app.contact.last_message_preview(this.app.selected, message, true);
        this.app.contact.focus(this.app.selected);
        
        this.app.socket.emit(`typing`, this.app.username, this.app.selected, false);
        this.app.socket.emit(`send_message`, this.app.username, this.app.selected, message);
    }
    
    load_previous(username) {
        return new Promise((resolve) => {
            $.ajax({
                url: `/messages/` + username,
                type: `GET`,
                dataType: `json`,
                async: false,
                success: (messages) => {
                    messages.forEach(message => {
                        this.app.ui.add_message(message.message, message.self);
                    });
                    resolve();
                }
            });
        });
    }
    
    received(data) {
        let { sender, message } = data;
        
        this.app.contact.last_message_preview(sender, message, false);
        this.app.contact.focus(sender);

        if (this.app.selected === sender) {
            this.app.typing.label(false);
            this.app.ui.add_message(message, false);
        }
    }
}

class Contact {
    constructor(app) {
        this.app = app;
    }
    
    last_message_preview(username, message, self) {
        let text = self ? `You: ` + message : message;
        let preview = text.length > 25 ? text.substring(0, 25) + `...` : text;
        $(`.contact[data-username="${username}"] #description`).text(preview);
    }
    
    focus(username) {
        let contact = $(`.contact[data-username="${username}"]`);

        if (contact.index() !== 0) {
            $(`.contacts`).prepend(contact);
        }
    }
    
    label(username, status) {
        let contact = $(`.contact[data-username="${username}"]`);
        
        if (status === `online`) {
            contact.addClass(`online`);
        } else {
            contact.removeClass(`online`);
        }
        
        this.app.online[username] = status === `online`;

        if (this.app.selected === username && 
            !$(`.conversation .top .info p`).hasClass(`typing`)) {
            $(`.conversation .top .info p`).text(status === `online` ? `online` : `offline`);
        }
    }
    
    click(contact) {
        this.app.open_chat();

        let info = {
            name: contact.find(`h4`).text(),
            username: String(contact.data(`username`)),
            image: contact.find(`img`).attr(`src`)
        };
        
        this.app.select_contact(info.username);
        this.app.ui.update_header(info, this.app.online[info.username] === true);
        this.app.ui.clear();
        
        $(`#message`).val(``).focus();
        
        this.app.message.load_previous(info.username).then(() => {
            this.app.ui.scroll();
        });
    }
    
    set_status(data) {
        let { username, status } = data;
        
        this.label(username, status);
        
        if (status !== `online` && this.app.selected === username) {
            this.app.typing.label(false);
        }
    }
    
    set_all_status(users) {
        this.app.online = users;
        
        for (let username in users) {
            this.label(username, users[username] ? `online` : `offline`);
        }
    }
    
    load_last_messages() {
        $(`.contact`).each((_, contact) => {
            let username = $(contact).data(`username`);
            
            $.ajax({
                url: `/last-message/${username}`,
                type: `GET`,
                dataType: `json`,
                success: (data) => {
                    if (!data.message) {
                        $(`.contact[data-username="${username}"] #description`).text(`No messages`);
                        return;
                    }
                    
                    this.last_message_preview(username, data.message, data.self);
                }
            });
        });
    }
}

class Typing {
    constructor(app) {
        this.app = app;
        this.time = null;
    }
    
    label(isTyping) {
        if (isTyping) {
            $(`.conversation .top .info p`).html(`typing...`);
        } else {
            $(`.conversation .top .info p`).text(this.app.online[this.app.selected] === true ? `online` : `offline`);
        }
    }
    
    handler() {
        if (this.app.selected) {
            this.app.socket.emit(`typing`, this.app.username, this.app.selected, true);
            this.clear();
            
            this.time = setTimeout(() => {
                this.app.socket.emit(`typing`, this.app.username, this.app.selected, false);
            }, 1000);
        }
    }
    
    blur() {
        if (this.app.selected) {
            this.clear();
            this.app.socket.emit(`typing`, this.app.username, this.app.selected, false);
        }
    }
    
    refresh(data) {
        let { username, isTyping } = data;
        
        if (this.app.selected === username) {
            this.label(isTyping);
        }
    }
        
    clear() {
        if (this.time) {
            clearTimeout(this.time);
            this.time = null;
        }
    }
}


$(document).ready(() => {
    const chat = new Chat();
});

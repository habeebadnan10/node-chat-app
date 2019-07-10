const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sideBarTemplate =  document.querySelector('#sidebar-template').innerHTML

//options
const { username , room } = Qs.parse(location.search , { ignoreQueryPrefix : true})

const autoScroll = () => {
    //newmsg element
    const $newMessage = $messages.lastElementChild

    //Height of new msg
    const newMsgStyles = getComputedStyle($newMessage)
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMessage.offsetHeight + newMsgMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of msgs container
    const containerHeight =$messages.scrollHeight

    //How far have I scroll'
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMsgHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate , {
        username : msg.username,
        message : msg.text,
        createdAt : moment(msg.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on("locationMessage" , (val) => {
    const html = Mustache.render(locationMessageTemplate , {
        username : val.username,
        url : val.url,
        createdAt : moment(val.createdAt).format('h:mm A')
    })
    console.log(val)
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on("roomData" , ({ room , users}) => {
    const html = Mustache.render(sideBarTemplate , {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('message delivered')
    })
})

$locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    //disabled 
    $locationButton.setAttribute('disabled' , 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position)

        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            //enable
            $locationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit("join" , { username , room } , (error) => {
    if(error){
        alert(error)
        location.href =  '/'
    }
})
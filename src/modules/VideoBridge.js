import React from 'react'

export default class VideoBridge extends React.Component {
  constructor(props) {
    super(props);
  }
  init(role, localStream) {
    let dc,
      pc,
      remoteStream,
      haveMedia = false,
      onMessage = message => {
          console.log('message from peer:', message);
          if (message.type === 'offer') {
              // set remote description and answer
              pc.setRemoteDescription(new RTCSessionDescription(message));
              pc.createAnswer()
                .then(setDescription)
                .then(sendDescription)
                .catch(handleError); // An error occurred, so handle the failure to connect

          } else if (message.type === 'answer') {
              // set remote description
              pc.setRemoteDescription(new RTCSessionDescription(message));
          } else if (message.type === 'candidate') {
              // add ice candidate
              pc.addIceCandidate(
                  new RTCIceCandidate({
                      sdpMLineIndex: message.mlineindex,
                      candidate: message.candidate
                  })
              );
          }
      },
      sendData = msg => dc.send(JSON.stringify(msg)),
      setDescription = offer => pc.setLocalDescription(offer),
      // send the offer to a server to be forwarded to the other peer
      sendDescription = () => {console.log(201, 'sendDescription', pc.localDescription);this.props.socket.send(pc.localDescription)},
      // Set up the data channel message handler
      setupDataHandlers = () => {
          dc.onmessage = e => {
              var msg = JSON.parse(e.data);
              console.log('received message over data channel:' + msg);
          };
          dc.onclose = () => {
              //this.props.localStream.getVideoTracks()[0].stop();
              remoteStream.getVideoTracks()[0].stop();
              //haveMedia = false;
              role = '';
              //this.props.setUser('');
              console.log('The Data Channel is Closed');
          };
      },
      handleError = e => console.log(e),
      // If RTCPeerConnection is ready and we have local media,
      // attach media to pc
      attachMediaIfReady = () => {
        haveMedia = this.props.haveMedia;
        console.log('attachMediaIfReady', pc, localStream, /*this.props.user*/);
        if (pc/* && haveMedia*/) {
          pc.addStream(localStream);
          // call if we were the last to connect (to increase
          // chances that everything is set up properly at both ends)
          if (role === 'host') {
              dc = pc.createDataChannel('chat');
              setupDataHandlers();
              console.log(200, 'createOffer')
              pc.createOffer()
                .then(setDescription)
                .then(sendDescription)
                .catch(handleError); // An error occurred, so handle the failure to connect
          }
        }
      };
    // chrome polyfill for connection between the local device and a remote peer
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    // set up the peer connection
    // this is one of Google's public STUN servers
    pc = new RTCPeerConnection({iceServers: [{url: 'stun:stun.l.google.com:19302'}]});
    // when our browser gets a candidate, send it to the peer
    pc.onicecandidate = e => {
        console.log(e, 'onicecandidate');
        if (e.candidate) {
            this.props.socket.send({
                type: 'candidate',
                mlineindex: e.candidate.sdpMLineIndex,
                candidate: e.candidate.candidate
            });
        }
    };
    // when the other side added a media stream, show it on screen
    pc.onaddstream = e => {
        console.log('onaddstream', e) 
        remoteStream = e.stream;
        this.refs.remoteVideo.src = window.URL.createObjectURL(remoteStream);
    };
    pc.ondatachannel = e => {
        // data channel
        dc = e.channel;
        setupDataHandlers();
        sendData({
          peerMediaStream: {
            video: localStream.getVideoTracks()[0].enabled/*,
            audio: this.props.localStream.getAudioTracks()[0].enabled*/
          }
        });
        //sendData('hello');
    };
    // wait for local media to be ready
    this.props.getUserMedia.then(attachMediaIfReady);
    this.props.socket.on('message', onMessage);
  }
  render(){
    return (
      <div>
        <video ref="remoteVideo" autoPlay></video>
      </div>
    );
  }
}
export function speak(text){

 if(typeof window==="undefined") return

 if(window.speechSynthesis.speaking)
  window.speechSynthesis.cancel()

 const speech=new SpeechSynthesisUtterance(text)

 speech.lang="en-US"

 window.speechSynthesis.speak(speech)
}
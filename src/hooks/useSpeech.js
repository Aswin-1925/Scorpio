export default function useSpeech(){

 const speak = text => {

  if(!window.speechSynthesis) return

  const speech = new SpeechSynthesisUtterance(text)

  speech.lang="en-US"

  window.speechSynthesis.speak(speech)

 }

 return speak

}
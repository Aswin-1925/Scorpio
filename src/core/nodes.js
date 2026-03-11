import {
 Microscope,
 Gavel,
 ShieldCheck,
 Truck,
 Search,
 Briefcase
} from "lucide-react"

export const STATIC_NODES = [
 { id:"n1",name:"Science Audit",icon:<Microscope size={16}/>,prompt:"Bio-Regulatory Auditor mode."},
 { id:"n2",name:"Legal Log",icon:<Gavel size={16}/>,prompt:"Patent Lawyer mode."},
 { id:"n3",name:"Supply Chain",icon:<Truck size={16}/>,prompt:"Logistics Expert mode."},
 { id:"n4",name:"IP Hunter",icon:<Search size={16}/>,prompt:"IP Strategist mode."},
 { id:"n5",name:"NAMs Report",icon:<ShieldCheck size={16}/>,prompt:"FDA Specialist mode."},
 { id:"n6",name:"Consultant",icon:<Briefcase size={16}/>,prompt:"Consultant mode."}
]
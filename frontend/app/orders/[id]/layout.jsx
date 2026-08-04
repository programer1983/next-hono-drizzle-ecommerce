import { usePathname } from "next/navigation";
import { use } from "react";

export default function OrderDetailLayout({children, params}){
     const {id} = use(params)
     const pathname = usePathname()

     
}
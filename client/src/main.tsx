import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faLink, faLinkSlash, faHouse, faClock, faBookmark, faTag, faGraduationCap, 
  faBriefcase, faBook, faNewspaper, faGear, faCircleQuestion, faSearch, 
  faCheck, faCheckDouble, faPlus, faChevronLeft, faChevronRight, faEllipsisVertical,
  faPenToSquare, faArrowUpRightFromSquare, faXmark, faMicroscope, faTools, faUsers,
  faCalendar
} from '@fortawesome/free-solid-svg-icons';

// Add icons to the library
library.add(
  faLink, faLinkSlash, faHouse, faClock, faBookmark, faTag, faGraduationCap, 
  faBriefcase, faBook, faNewspaper, faGear, faCircleQuestion, faSearch, 
  faCheck, faCheckDouble, faPlus, faChevronLeft, faChevronRight, faEllipsisVertical,
  faPenToSquare, faArrowUpRightFromSquare, faXmark, faMicroscope, faTools, faUsers,
  faCalendar
);

createRoot(document.getElementById("root")!).render(<App />);

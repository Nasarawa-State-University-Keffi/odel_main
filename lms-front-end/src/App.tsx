import { UserProvider } from "./context/UserProvider"
import Presentation from "./pages/Presentation"

function App() {
  return (
    <>
      <UserProvider>
        <Presentation />
      </UserProvider>
    </>
  )
}

export default App

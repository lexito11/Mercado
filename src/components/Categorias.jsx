import { useNavigate } from "react-router-dom";

function SeleccionarTienda() {
  const navigate = useNavigate();

  const seleccionarTienda = () => {
    navigate("/categorias");
  };

  return (
    <div>
      <h1>Seleccionar Tienda</h1>
      <button onClick={seleccionarTienda}>Continuar</button>
    </div>
  );
}

export default SeleccionarTienda;
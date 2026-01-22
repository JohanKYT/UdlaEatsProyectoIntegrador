package com.udlaeats.ms_restaurante.repository;

import com.udlaeats.ms_restaurante.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// Guardar, Buscar, Borrar y Actualizar sin escribir SQL.
@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByRestauranteId(Long restauranteId);
    // Para saber si existen productos en una categoría
    boolean existsByCategoriaId(Long categoriaId);
}

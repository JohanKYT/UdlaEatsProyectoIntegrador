package com.udlaeats.ms_restaurante.repository;

import com.udlaeats.ms_restaurante.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByRestauranteId(Long restauranteId);
}

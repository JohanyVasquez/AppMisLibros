import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { Libro } from "./src/models/Libro";
import { LibroService } from "./src/services/LibroService";
import { LibroRepository } from "./src/repositories/LibroRepository";

const libroService = new LibroService();

// Prueba del patrón Singleton
const repository1 = LibroRepository.getInstance();
const repository2 = LibroRepository.getInstance();
console.log("¿Repository 1 y Repository 2 son la misma instancia?", repository1 === repository2);

export default function App() {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [anio, setAnio] = useState("");
  const [libros, setLibros] = useState<Libro[]>(libroService.obtenerLibros());

  const agregarLibro = () => {
    if (!titulo.trim() || !autor.trim() || !anio.trim()) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    const anioNumero = Number(anio);
    if (isNaN(anioNumero)) {
      Alert.alert("Error", "El año debe ser un número");
      return;
    }
    libroService.agregarLibro(new Libro(Date.now(), titulo, autor, anioNumero));
    setLibros([...libroService.obtenerLibros()]);
    setTitulo(""); setAutor(""); setAnio("");
  };

  const eliminarLibro = (id: number) => {
    libroService.eliminarLibro(id);
    setLibros([...libroService.obtenerLibros()]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>📚 Mis Libros</Text>
      <TextInput style={styles.input} placeholder="Título" value={titulo} onChangeText={setTitulo} />
      <TextInput style={styles.input} placeholder="Autor" value={autor} onChangeText={setAutor} />
      <TextInput style={styles.input} placeholder="Año" value={anio} onChangeText={setAnio} keyboardType="numeric" />
      <TouchableOpacity style={styles.botonAgregar} onPress={agregarLibro}>
        <Text style={styles.textoBoton}>Agregar libro</Text>
      </TouchableOpacity>
      <Text style={styles.subtitulo}>Lista de libros</Text>
      <FlatList
        data={libros}
        keyExtractor={(item) => item.getId().toString()}
        ListEmptyComponent={<Text style={styles.vacio}>No hay libros registrados.</Text>}
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={styles.info}>
              <Text style={styles.nombreLibro}>{item.getTitulo()}</Text>
              <Text>Autor: {item.getAutor()}</Text>
              <Text>Año: {item.getAnio()}</Text>
              <Text style={styles.descripcion}>{item.obtenerDescripcion()}</Text>
            </View>
            <TouchableOpacity style={styles.botonEliminar} onPress={() => eliminarLibro(item.getId())}>
              <Text style={styles.textoBoton}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#f4f4f4" },
  titulo: { fontSize: 30, fontWeight: "bold", textAlign: "center", marginBottom: 25 },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 10 },
  botonAgregar: { backgroundColor: "#007bff", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 25 },
  textoBoton: { color: "white", fontWeight: "bold" },
  subtitulo: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  tarjeta: { backgroundColor: "white", padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  info: { flex: 1 },
  nombreLibro: { fontSize: 18, fontWeight: "bold" },
  descripcion: { marginTop: 5, fontStyle: "italic" },
  botonEliminar: { backgroundColor: "#dc3545", padding: 10, borderRadius: 8, marginLeft: 10 },
  vacio: { textAlign: "center", color: "#666", marginTop: 20 }
});

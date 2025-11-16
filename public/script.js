const form = document.getElementById('questionnaireForm');
const successMessage = document.getElementById('successMessage');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        ville: document.getElementById('ville').value,
        etablissement: document.getElementById('etablissement').value,
        modalite: document.getElementById('modalite').value,
        aspect_moins_clair: document.getElementById('aspect_moins_clair').value,
        suggestion: document.getElementById('suggestion').value,
        point_positif: document.getElementById('point_positif').value,
        date_soumission: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                form.reset();
                form.style.display = 'block';
                successMessage.style.display = 'none';
            }, 5000);
        } else {
            alert('❌ Une erreur est survenue. Réessaie dans quelques instants !');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Impossible d\'envoyer ta réponse. Vérifie ta connexion internet !');
    }
});

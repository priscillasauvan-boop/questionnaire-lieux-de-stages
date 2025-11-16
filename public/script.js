const form = document.getElementById('questionnaireForm');
const successMessage = document.getElementById('successMessage');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        ville: document.getElementById('ville').value,
        etablissement: document.getElementById('etablissement').value,
        modalite: document.getElementById('modalite').value,
        q1_accueil: document.querySelector('input[name="q1"]:checked').value,
        q2_adaptation_tuteur: document.querySelector('input[name="q2"]:checked').value,
        q3_tuteur_attitré: document.querySelector('input[name="q3"]:checked').value,
        q4_changement_tuteur: document.querySelector('input[name="q4"]:checked').value,
        q5_missions_claires: document.querySelector('input[name="q5"]:checked').value,
        q6_communication: document.querySelector('input[name="q6"]:checked').value,
        q7_suivi_retours: document.querySelector('input[name="q7"]:checked').value,
        q8_reconnaissance: document.querySelector('input[name="q8"]:checked').value,
        q9_autre_aspect: document.querySelector('input[name="q9"]:checked').value,
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

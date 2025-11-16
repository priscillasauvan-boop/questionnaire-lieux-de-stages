const form = document.getElementById('questionnaireForm');
const successMessage = document.getElementById('successMessage');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        ville: document.getElementById('ville').value,
        etablissement: document.getElementById('etablissement').value,
        modalite: document.getElementById('modalite').value,
        q1_accueil: document.getElementById('q1').value,
        q2_adaptation_tuteur: document.getElementById('q2').value,
        q3_tuteur_attitré: document.getElementById('q3').value,
        q4_changement_tuteur: document.getElementById('q4').value,
        q5_missions_claires: document.getElementById('q5').value,
        q6_communication: document.getElementById('q6').value,
        q7_suivi_retours: document.getElementById('q7').value,
        q8_reconnaissance: document.getElementById('q8').value,
        q9_autre_aspect: document.getElementById('q9').value,
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
